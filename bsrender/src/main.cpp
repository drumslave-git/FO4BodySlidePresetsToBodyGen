#include <tinyxml2.h>

#include <NifFile.hpp>
#include <Geometry.hpp>
#include <BasicTypes.hpp>

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

namespace fs = std::filesystem;
using tinyxml2::XMLElement;
using tinyxml2::XMLDocument;

static bool gVerbose = false;

struct Args {
    std::string dataRoot;
    std::string presetName;
    std::string presetFile;
    std::string sliderSetName;
    std::string outPath;
    std::string exportGlbPath;
    int size = 1024;
    bool verbose = false;
    float yawDeg = 45.0f;
    float pitchDeg = 0.0f;
    float rollDeg = 0.0f;
};

static void PrintUsage() {
    std::cout
        << "bsrender --preset-name <name> --data-root <BodySlideData> --out <file.png> [options]\n"
        << "\nOptions:\n"
        << "  --preset-file <file>    Preset XML file to search (optional)\n"
        << "  --slider-set <name>     Override slider set name (optional)\n"
        << "  --size <px>             Output image size (default 1024)\n"
        << "  --export-glb <file>     Export deformed mesh to GLB\n"
        << "  --yaw <deg>             Yaw around Z axis (default 45)\n"
        << "  --pitch <deg>           Pitch around X axis (default 0)\n"
        << "  --roll <deg>            Roll around Y axis (default 0)\n"
        << "  --verbose               Extra logging\n";
}

static bool ParseArgs(int argc, char** argv, Args& args) {
    for (int i = 1; i < argc; ++i) {
        std::string key = argv[i];
        auto next = [&](std::string& out) -> bool {
            if (i + 1 >= argc) return false;
            out = argv[++i];
            return true;
        };
        if (key == "--data-root") {
            if (!next(args.dataRoot)) return false;
        } else if (key == "--preset-name") {
            if (!next(args.presetName)) return false;
        } else if (key == "--preset-file") {
            if (!next(args.presetFile)) return false;
        } else if (key == "--slider-set") {
            if (!next(args.sliderSetName)) return false;
        } else if (key == "--out") {
            if (!next(args.outPath)) return false;
        } else if (key == "--size") {
            std::string val;
            if (!next(val)) return false;
            args.size = std::max(64, std::stoi(val));
        } else if (key == "--export-glb") {
            if (!next(args.exportGlbPath)) return false;
        } else if (key == "--yaw") {
            std::string val;
            if (!next(val)) return false;
            args.yawDeg = std::stof(val);
        } else if (key == "--pitch") {
            std::string val;
            if (!next(val)) return false;
            args.pitchDeg = std::stof(val);
        } else if (key == "--roll") {
            std::string val;
            if (!next(val)) return false;
            args.rollDeg = std::stof(val);
        } else if (key == "--verbose") {
            args.verbose = true;
        } else {
            return false;
        }
    }

    if (args.presetName.empty() || args.dataRoot.empty() || args.outPath.empty()) {
        return false;
    }

    return true;
}

struct Preset {
    std::string name;
    std::string setName;
    std::unordered_map<std::string, float> big;
    std::unordered_map<std::string, float> small;
};

static bool LoadPresetFromFile(const fs::path& file, const std::string& presetName, Preset& outPreset) {
    XMLDocument doc;
    if (doc.LoadFile(file.string().c_str()) != tinyxml2::XML_SUCCESS) {
        return false;
    }

    auto* root = doc.FirstChildElement("SliderPresets");
    if (!root) return false;

    for (auto* presetElem = root->FirstChildElement("Preset"); presetElem; presetElem = presetElem->NextSiblingElement("Preset")) {
        const char* nameAttr = presetElem->Attribute("name");
        if (!nameAttr) continue;
        if (presetName != nameAttr) continue;

        const char* setAttr = presetElem->Attribute("set");
        if (!setAttr) return false;

        outPreset.name = nameAttr;
        outPreset.setName = setAttr;

        for (auto* setSlider = presetElem->FirstChildElement("SetSlider"); setSlider; setSlider = setSlider->NextSiblingElement("SetSlider")) {
            const char* sliderName = setSlider->Attribute("name");
            const char* sizeAttr = setSlider->Attribute("size");
            if (!sliderName || !sizeAttr) continue;
            float value = setSlider->FloatAttribute("value") / 100.0f;

            std::string size = sizeAttr;
            if (size == "big") {
                outPreset.big[sliderName] = value;
            } else if (size == "small") {
                outPreset.small[sliderName] = value;
            } else if (size == "both") {
                outPreset.big[sliderName] = value;
                outPreset.small[sliderName] = value;
            }
        }

        return true;
    }

    return false;
}

static bool FindPreset(const fs::path& presetsDir, const std::string& presetName, const std::string& presetFile, Preset& outPreset) {
    if (!presetFile.empty()) {
        return LoadPresetFromFile(presetFile, presetName, outPreset);
    }

    if (!fs::exists(presetsDir)) return false;

    for (auto& entry : fs::recursive_directory_iterator(presetsDir)) {
        if (!entry.is_regular_file()) continue;
        if (entry.path().extension() != ".xml") continue;
        if (LoadPresetFromFile(entry.path(), presetName, outPreset)) {
            return true;
        }
    }

    return false;
}

struct SliderDataFile {
    std::string dataName;
    std::string targetName;
    std::string fileName;
    bool local = true;
};

struct Slider {
    std::string name;
    bool invert = false;
    bool clamp = false;
    bool zap = false;
    bool uv = false;
    float defaultValue = 0.0f;
    std::vector<SliderDataFile> dataFiles;
};

struct SliderSet {
    std::string name;
    std::string dataFolder;
    std::string sourceFile;
    std::vector<std::pair<std::string, std::string>> shapes; // shapeName, targetName
    std::vector<Slider> sliders;
};

static bool LoadSliderSetFromFile(const fs::path& file, const std::string& setName, SliderSet& outSet) {
    XMLDocument doc;
    if (doc.LoadFile(file.string().c_str()) != tinyxml2::XML_SUCCESS) {
        return false;
    }

    auto* root = doc.FirstChildElement("SliderSetInfo");
    if (!root) return false;

    for (auto* setElem = root->FirstChildElement("SliderSet"); setElem; setElem = setElem->NextSiblingElement("SliderSet")) {
        const char* nameAttr = setElem->Attribute("name");
        if (!nameAttr) continue;
        if (setName != nameAttr) continue;

        outSet.name = nameAttr;

        auto* dataFolder = setElem->FirstChildElement("DataFolder");
        if (dataFolder && dataFolder->GetText()) outSet.dataFolder = dataFolder->GetText();

        auto* sourceFile = setElem->FirstChildElement("SourceFile");
        if (sourceFile && sourceFile->GetText()) outSet.sourceFile = sourceFile->GetText();

        for (auto* shape = setElem->FirstChildElement("Shape"); shape; shape = shape->NextSiblingElement("Shape")) {
            const char* targetAttr = shape->Attribute("target");
            const char* text = shape->GetText();
            if (!targetAttr || !text) continue;
            outSet.shapes.emplace_back(text, targetAttr);
        }

        for (auto* sliderElem = setElem->FirstChildElement("Slider"); sliderElem; sliderElem = sliderElem->NextSiblingElement("Slider")) {
            Slider s;
            const char* sliderName = sliderElem->Attribute("name");
            if (!sliderName) continue;
            s.name = sliderName;
            s.invert = sliderElem->BoolAttribute("invert", false);
            s.clamp = sliderElem->BoolAttribute("clamp", false);
            s.zap = sliderElem->BoolAttribute("zap", false);
            s.uv = sliderElem->BoolAttribute("uv", false);
            s.defaultValue = sliderElem->FloatAttribute("default", 0.0f) / 100.0f;

            for (auto* dataElem = sliderElem->FirstChildElement("Data"); dataElem; dataElem = dataElem->NextSiblingElement("Data")) {
                const char* dataName = dataElem->Attribute("name");
                const char* targetName = dataElem->Attribute("target");
                const char* text = dataElem->GetText();
                if (!dataName || !targetName || !text) continue;

                SliderDataFile ddf;
                ddf.dataName = dataName;
                ddf.targetName = targetName;
                ddf.fileName = text;
                ddf.local = dataElem->BoolAttribute("local", true);
                s.dataFiles.push_back(std::move(ddf));
            }

            outSet.sliders.push_back(std::move(s));
        }

        return true;
    }

    return false;
}

static bool FindSliderSetFile(const fs::path& sliderSetsDir, const std::string& setName, SliderSet& outSet) {
    if (!fs::exists(sliderSetsDir)) return false;

    for (auto& entry : fs::directory_iterator(sliderSetsDir)) {
        if (!entry.is_regular_file()) continue;
        if (entry.path().extension() != ".osp") continue;
        if (LoadSliderSetFromFile(entry.path(), setName, outSet)) {
            return true;
        }
    }

    return false;
}

using TargetDataDiffs = std::unordered_map<uint16_t, nifly::Vector3>;

struct OSDFile {
    std::unordered_map<std::string, std::unique_ptr<TargetDataDiffs>> dataDiffs;

    bool Read(const fs::path& fileName) {
        std::ifstream file(fileName, std::ios::binary);
        if (!file) {
            if (gVerbose) {
                std::cerr << "Failed to open OSD: " << fileName.string() << "\n";
            }
            return false;
        }

        char header[4] = {0, 0, 0, 0};
        file.read(header, 4);
        bool headerOk = (header[0] == 'O' && header[1] == 'S' && header[2] == 'D' && header[3] == '\0') ||
                        (header[0] == '\0' && header[1] == 'D' && header[2] == 'S' && header[3] == 'O');
        if (!headerOk) {
            if (gVerbose) {
                std::cerr << "Invalid OSD header in " << fileName.string()
                          << " bytes: "
                          << std::hex
                          << static_cast<int>(static_cast<unsigned char>(header[0])) << " "
                          << static_cast<int>(static_cast<unsigned char>(header[1])) << " "
                          << static_cast<int>(static_cast<unsigned char>(header[2])) << " "
                          << static_cast<int>(static_cast<unsigned char>(header[3]))
                          << std::dec << "\n";
            }
            return false;
        }

        uint32_t version = 0;
        file.read(reinterpret_cast<char*>(&version), 4);
        (void)version;

        uint32_t dataCount = 0;
        file.read(reinterpret_cast<char*>(&dataCount), 4);

        for (uint32_t i = 0; i < dataCount; ++i) {
            uint8_t nameLength = 0;
            file.read(reinterpret_cast<char*>(&nameLength), 1);
            std::string dataName(nameLength, '\0');
            file.read(dataName.data(), nameLength);

            uint16_t diffSize = 0;
            file.read(reinterpret_cast<char*>(&diffSize), 2);

#pragma pack(push, 1)
            struct DiffStruct {
                uint16_t index = 0;
                nifly::Vector3 diff;
            };
#pragma pack(pop)

            std::vector<DiffStruct> diffData(diffSize);
            file.read(reinterpret_cast<char*>(diffData.data()), diffSize * sizeof(DiffStruct));

            auto diffs = std::make_unique<TargetDataDiffs>();
            diffs->reserve(diffSize);
            for (const auto& diffEntry : diffData) {
                auto v = diffEntry.diff;
                v.clampEpsilon();
                (*diffs)[diffEntry.index] = v;
            }

            dataDiffs.emplace(std::move(dataName), std::move(diffs));
        }

        if (gVerbose) {
            std::cerr << "Loaded OSD: " << fileName.string() << " entries: " << dataCount << "\n";
        }

        return true;
    }
};

struct DiffDataSets {
    std::unordered_map<std::string, std::unique_ptr<TargetDataDiffs>> namedSet;
    std::unordered_map<std::string, std::string> dataTargets;

    bool HasSet(const std::string& set) const {
        return namedSet.find(set) != namedSet.end();
    }

    size_t GetSetSize(const std::string& set) const {
        auto it = namedSet.find(set);
        if (it == namedSet.end()) return 0;
        return it->second->size();
    }

    bool TargetMatch(const std::string& set, const std::string& target) const {
        auto it = dataTargets.find(set);
        return it != dataTargets.end() && it->second == target;
    }

    void MoveToSet(const std::string& name, const std::string& target, std::unique_ptr<TargetDataDiffs>& inDiffData) {
        namedSet[name] = std::move(inDiffData);
        dataTargets[name] = target;
    }

    void LoadSetCopy(const std::string& name, const std::string& target, const TargetDataDiffs& inDiffData) {
        namedSet[name] = std::make_unique<TargetDataDiffs>(inDiffData);
        dataTargets[name] = target;
    }

    bool LoadData(const std::unordered_map<std::string, std::unordered_map<std::string, std::string>>& osdNames) {
        for (const auto& osd : osdNames) {
            OSDFile osdFile;
            if (!osdFile.Read(osd.first)) {
                continue;
            }
            for (const auto& dataNames : osd.second) {
                auto it = osdFile.dataDiffs.find(dataNames.first);
                if (it == osdFile.dataDiffs.end()) continue;
                LoadSetCopy(dataNames.first, dataNames.second, *it->second);
            }
        }
        return true;
    }

    bool ApplyDiff(const std::string& set, const std::string& target, float percent, std::vector<nifly::Vector3>& inOut) const {
        if (percent == 0.0f) return false;
        if (!TargetMatch(set, target)) return false;
        auto it = namedSet.find(set);
        if (it == namedSet.end()) return false;

        uint16_t maxidx = static_cast<uint16_t>(inOut.size());
        for (const auto& diff : *it->second) {
            if (diff.first >= maxidx) continue;
            inOut[diff.first].x += diff.second.x * percent;
            inOut[diff.first].y += diff.second.y * percent;
            inOut[diff.first].z += diff.second.z * percent;
        }
        return true;
    }

    bool ApplyClamp(const std::string& set, const std::string& target, std::vector<nifly::Vector3>& inOut) const {
        if (!TargetMatch(set, target)) return false;
        auto it = namedSet.find(set);
        if (it == namedSet.end()) return false;

        uint16_t maxidx = static_cast<uint16_t>(inOut.size());
        for (const auto& diff : *it->second) {
            if (diff.first >= maxidx) continue;
            inOut[diff.first] = diff.second;
        }
        return true;
    }

    void GetDiffIndices(const std::string& set, const std::string& target, std::vector<uint16_t>& outIndices, float threshold = 0.0f) const {
        if (!TargetMatch(set, target)) return;
        auto it = namedSet.find(set);
        if (it == namedSet.end()) return;

        for (const auto& diff : *it->second) {
            if (std::fabs(diff.second.x) > threshold || std::fabs(diff.second.y) > threshold || std::fabs(diff.second.z) > threshold) {
                outIndices.push_back(diff.first);
            }
        }

        std::sort(outIndices.begin(), outIndices.end());
        outIndices.erase(std::unique(outIndices.begin(), outIndices.end()), outIndices.end());
    }
};

static fs::path FindFileRecursive(const fs::path& root, const std::string& fileName) {
    for (auto& entry : fs::recursive_directory_iterator(root)) {
        if (!entry.is_regular_file()) continue;
        if (entry.path().filename().string() == fileName) return entry.path();
    }
    return {};
}

struct MeshShape {
    std::string name;
    std::string targetName;
    std::vector<nifly::Vector3> verts;
    std::vector<nifly::Triangle> tris;
};

static bool LoadMeshShapes(const fs::path& nifPath, const SliderSet& sliderSet, std::vector<MeshShape>& outShapes) {
    nifly::NifFile nif(nifPath);
    if (!nif.IsValid()) return false;

    for (const auto& shapePair : sliderSet.shapes) {
        const std::string& shapeName = shapePair.first;
        const std::string& targetName = shapePair.second;

        auto* shape = nif.FindBlockByName<nifly::NiShape>(shapeName);
        if (!shape) {
            std::cerr << "Shape not found in NIF: " << shapeName << "\n";
            return false;
        }

        std::vector<nifly::Vector3> verts;
        if (!nif.GetVertsForShape(shape, verts)) {
            std::cerr << "Failed to read verts for shape: " << shapeName << "\n";
            return false;
        }

        std::vector<nifly::Triangle> tris;
        if (!shape->GetTriangles(tris)) {
            std::cerr << "Failed to read triangles for shape: " << shapeName << "\n";
            return false;
        }

        MeshShape ms;
        ms.name = shapeName;
        ms.targetName = targetName;
        ms.verts = std::move(verts);
        ms.tris = std::move(tris);
        outShapes.push_back(std::move(ms));
    }

    return true;
}

static void BuildDiffDataSets(const SliderSet& sliderSet,
                              const fs::path& shapeDataRoot,
                              DiffDataSets& outSets,
                              bool verbose) {
    std::unordered_map<std::string, std::unordered_map<std::string, std::string>> osdNames;
    size_t missingFiles = 0;
    size_t totalRefs = 0;

    for (const auto& slider : sliderSet.sliders) {
        for (const auto& ddf : slider.dataFiles) {
            if (ddf.fileName.size() <= 4) continue;

            const bool isBSD = ddf.fileName.size() >= 4 && ddf.fileName.substr(ddf.fileName.size() - 4) == ".bsd";
            if (isBSD) continue;

            size_t split = ddf.fileName.find_last_of('/');
            if (split == std::string::npos) split = ddf.fileName.find_last_of('\\');
            if (split == std::string::npos) continue;

            std::string fileName = ddf.fileName.substr(0, split);
            std::string dataName = ddf.fileName.substr(split + 1);

            fs::path osdPath = shapeDataRoot / sliderSet.dataFolder / fileName;
            if (!fs::exists(osdPath)) {
                osdPath = FindFileRecursive(shapeDataRoot, fileName);
            }

            if (!osdPath.empty()) {
                osdNames[osdPath.string()][dataName] = ddf.targetName;
                totalRefs++;
                if (verbose && totalRefs <= 3) {
                    std::cerr << "OSD ref: " << osdPath.string() << " data " << dataName << "\n";
                }
            } else {
                missingFiles++;
                if (verbose) {
                    std::cerr << "Missing OSD: " << fileName << " (data " << dataName << ")\n";
                }
            }
        }
    }

    outSets.LoadData(osdNames);

    std::cout << "OSD refs: " << totalRefs << ", missing files: " << missingFiles
              << ", loaded sets: " << outSets.namedSet.size() << "\n";
}

static float GetPresetValue(const Preset& preset, const Slider& slider) {
    auto itBig = preset.big.find(slider.name);
    if (itBig != preset.big.end()) return itBig->second;
    auto itSmall = preset.small.find(slider.name);
    if (itSmall != preset.small.end()) return itSmall->second;
    return slider.defaultValue;
}

struct Vec3 {
    float x = 0.0f;
    float y = 0.0f;
    float z = 0.0f;
};

static Vec3 RotateZ(const Vec3& v, float radians) {
    float c = std::cos(radians);
    float s = std::sin(radians);
    return {v.x * c - v.y * s, v.x * s + v.y * c, v.z};
}

static Vec3 RotateX(const Vec3& v, float radians) {
    float c = std::cos(radians);
    float s = std::sin(radians);
    return {v.x, v.y * c - v.z * s, v.y * s + v.z * c};
}

static Vec3 RotateY(const Vec3& v, float radians) {
    float c = std::cos(radians);
    float s = std::sin(radians);
    return {v.x * c + v.z * s, v.y, -v.x * s + v.z * c};
}

static Vec3 RotateYawPitchRoll(const Vec3& v, float yaw, float pitch, float roll) {
    Vec3 r = RotateZ(v, yaw);
    r = RotateX(r, pitch);
    r = RotateY(r, roll);
    return r;
}

static Vec3 Sub(const Vec3& a, const Vec3& b) {
    return {a.x - b.x, a.y - b.y, a.z - b.z};
}

static Vec3 Cross(const Vec3& a, const Vec3& b) {
    return {a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x};
}

static float Dot(const Vec3& a, const Vec3& b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

static Vec3 Normalize(const Vec3& v) {
    float len = std::sqrt(Dot(v, v));
    if (len <= 0.000001f) return {0.0f, 0.0f, 0.0f};
    return {v.x / len, v.y / len, v.z / len};
}

static std::vector<Vec3> ComputeVertexNormals(const std::vector<Vec3>& verts,
                                              const std::vector<std::array<uint32_t, 3>>& tris) {
    std::vector<Vec3> normals;
    normals.assign(verts.size(), {0.0f, 0.0f, 0.0f});

    for (const auto& tri : tris) {
        const Vec3& v0 = verts[tri[0]];
        const Vec3& v1 = verts[tri[1]];
        const Vec3& v2 = verts[tri[2]];
        Vec3 n = Normalize(Cross(Sub(v1, v0), Sub(v2, v0)));
        normals[tri[0]].x += n.x;
        normals[tri[0]].y += n.y;
        normals[tri[0]].z += n.z;
        normals[tri[1]].x += n.x;
        normals[tri[1]].y += n.y;
        normals[tri[1]].z += n.z;
        normals[tri[2]].x += n.x;
        normals[tri[2]].y += n.y;
        normals[tri[2]].z += n.z;
    }

    for (auto& n : normals) {
        n = Normalize(n);
    }

    return normals;
}

static void AppendBytes(std::vector<uint8_t>& dst, const void* src, size_t size) {
    const uint8_t* p = static_cast<const uint8_t*>(src);
    dst.insert(dst.end(), p, p + size);
}

static void AppendPadded(std::vector<uint8_t>& dst, const std::vector<uint8_t>& src, uint8_t padByte) {
    dst.insert(dst.end(), src.begin(), src.end());
    while (dst.size() % 4 != 0) {
        dst.push_back(padByte);
    }
}

static bool ExportGlb(const std::string& path,
                      const std::vector<Vec3>& verts,
                      const std::vector<std::array<uint32_t, 3>>& tris,
                      const std::vector<Vec3>& normals) {
    if (verts.empty() || tris.empty()) return false;
    if (normals.size() != verts.size()) return false;

    std::vector<uint8_t> bin;
    bin.reserve(verts.size() * sizeof(float) * 6 + tris.size() * sizeof(uint32_t) * 3);

    const uint32_t posOffset = static_cast<uint32_t>(bin.size());
    for (const auto& v : verts) {
        AppendBytes(bin, &v.x, sizeof(float));
        AppendBytes(bin, &v.y, sizeof(float));
        AppendBytes(bin, &v.z, sizeof(float));
    }

    const uint32_t normOffset = static_cast<uint32_t>(bin.size());
    for (const auto& n : normals) {
        AppendBytes(bin, &n.x, sizeof(float));
        AppendBytes(bin, &n.y, sizeof(float));
        AppendBytes(bin, &n.z, sizeof(float));
    }

    const uint32_t idxOffset = static_cast<uint32_t>(bin.size());
    for (const auto& t : tris) {
        AppendBytes(bin, &t[0], sizeof(uint32_t));
        AppendBytes(bin, &t[1], sizeof(uint32_t));
        AppendBytes(bin, &t[2], sizeof(uint32_t));
    }

    while (bin.size() % 4 != 0) {
        bin.push_back(0);
    }

    float minX = std::numeric_limits<float>::max();
    float minY = std::numeric_limits<float>::max();
    float minZ = std::numeric_limits<float>::max();
    float maxX = std::numeric_limits<float>::lowest();
    float maxY = std::numeric_limits<float>::lowest();
    float maxZ = std::numeric_limits<float>::lowest();
    for (const auto& v : verts) {
        minX = std::min(minX, v.x);
        minY = std::min(minY, v.y);
        minZ = std::min(minZ, v.z);
        maxX = std::max(maxX, v.x);
        maxY = std::max(maxY, v.y);
        maxZ = std::max(maxZ, v.z);
    }

    std::ostringstream json;
    json << "{";
    json << "\"asset\":{\"version\":\"2.0\"},";
    json << "\"buffers\":[{\"byteLength\":" << bin.size() << "}],";
    json << "\"bufferViews\":[";
    json << "{\"buffer\":0,\"byteOffset\":" << posOffset << ",\"byteLength\":" << (verts.size() * sizeof(float) * 3) << "},";
    json << "{\"buffer\":0,\"byteOffset\":" << normOffset << ",\"byteLength\":" << (normals.size() * sizeof(float) * 3) << "},";
    json << "{\"buffer\":0,\"byteOffset\":" << idxOffset << ",\"byteLength\":" << (tris.size() * sizeof(uint32_t) * 3) << ",\"target\":34963}";
    json << "],";
    json << "\"accessors\":[";
    json << "{\"bufferView\":0,\"componentType\":5126,\"count\":" << verts.size() << ",\"type\":\"VEC3\",";
    json << "\"min\":[" << minX << "," << minY << "," << minZ << "],";
    json << "\"max\":[" << maxX << "," << maxY << "," << maxZ << "]},";
    json << "{\"bufferView\":1,\"componentType\":5126,\"count\":" << normals.size() << ",\"type\":\"VEC3\"},";
    json << "{\"bufferView\":2,\"componentType\":5125,\"count\":" << (tris.size() * 3) << ",\"type\":\"SCALAR\"}";
    json << "],";
    json << "\"meshes\":[{\"primitives\":[{\"attributes\":{\"POSITION\":0,\"NORMAL\":1},\"indices\":2}]}],";
    json << "\"nodes\":[{\"mesh\":0}],";
    json << "\"scenes\":[{\"nodes\":[0]}],";
    json << "\"scene\":0";
    json << "}";

    std::string jsonStr = json.str();
    std::vector<uint8_t> jsonBytes(jsonStr.begin(), jsonStr.end());
    while (jsonBytes.size() % 4 != 0) {
        jsonBytes.push_back(' ');
    }

    std::vector<uint8_t> glb;
    glb.reserve(12 + 8 + jsonBytes.size() + 8 + bin.size());

    uint32_t magic = 0x46546C67; // 'glTF'
    uint32_t version = 2;
    uint32_t length = 12 + 8 + static_cast<uint32_t>(jsonBytes.size()) + 8 + static_cast<uint32_t>(bin.size());
    AppendBytes(glb, &magic, 4);
    AppendBytes(glb, &version, 4);
    AppendBytes(glb, &length, 4);

    uint32_t jsonChunkLen = static_cast<uint32_t>(jsonBytes.size());
    uint32_t jsonChunkType = 0x4E4F534A; // 'JSON'
    AppendBytes(glb, &jsonChunkLen, 4);
    AppendBytes(glb, &jsonChunkType, 4);
    AppendPadded(glb, jsonBytes, ' ');

    uint32_t binChunkLen = static_cast<uint32_t>(bin.size());
    uint32_t binChunkType = 0x004E4942; // 'BIN\0'
    AppendBytes(glb, &binChunkLen, 4);
    AppendBytes(glb, &binChunkType, 4);
    AppendPadded(glb, bin, 0);

    std::ofstream out(path, std::ios::binary);
    if (!out) return false;
    out.write(reinterpret_cast<const char*>(glb.data()), static_cast<std::streamsize>(glb.size()));
    return out.good();
}

struct DrawVertex {
    float sx = 0.0f;
    float sy = 0.0f;
    float depth = 0.0f;
    Vec3 world;
};

static bool RenderMesh(const std::vector<Vec3>& verts,
                       const std::vector<std::array<uint32_t, 3>>& tris,
                       int size,
                       const std::string& outPath,
                       float yawDeg,
                       float pitchDeg,
                       float rollDeg) {
    if (verts.empty() || tris.empty()) return false;

    const float yaw = yawDeg * 3.14159265f / 180.0f;
    const float pitch = pitchDeg * 3.14159265f / 180.0f;
    const float roll = rollDeg * 3.14159265f / 180.0f;

    std::vector<Vec3> rotated;
    rotated.reserve(verts.size());
    float minX = std::numeric_limits<float>::max();
    float minY = std::numeric_limits<float>::max();
    float maxX = std::numeric_limits<float>::lowest();
    float maxY = std::numeric_limits<float>::lowest();

    for (const auto& v : verts) {
        Vec3 r = RotateYawPitchRoll(v, yaw, pitch, roll);
        rotated.push_back(r);
        minX = std::min(minX, r.x);
        maxX = std::max(maxX, r.x);
        minY = std::min(minY, r.z);
        maxY = std::max(maxY, r.z);
    }

    float spanX = std::max(0.001f, maxX - minX);
    float spanY = std::max(0.001f, maxY - minY);

    int w = size;
    int h = size;
    int pad = static_cast<int>(size * 0.05f);

    std::vector<uint8_t> img(w * h * 4, 255);
    std::vector<float> zbuf(w * h, -std::numeric_limits<float>::infinity());

    Vec3 lightDir = Normalize({0.3f, -0.4f, 1.0f});
    Vec3 viewDir = Normalize({0.0f, -1.0f, 0.0f});

    std::vector<Vec3> normals = ComputeVertexNormals(rotated, tris);

    float scale = std::min((w - 2.0f * pad) / spanX, (h - 2.0f * pad) / spanY);
    float cx = (minX + maxX) * 0.5f;
    float cy = (minY + maxY) * 0.5f;

    auto toScreen = [&](const Vec3& v) -> DrawVertex {
        float px = (v.x - cx) * scale + (w * 0.5f);
        float py = (v.z - cy) * scale + (h * 0.5f);
        return {px, static_cast<float>(h - 1 - py), -v.y, v};
    };

    for (const auto& tri : tris) {
        DrawVertex v0 = toScreen(rotated[tri[0]]);
        DrawVertex v1 = toScreen(rotated[tri[1]]);
        DrawVertex v2 = toScreen(rotated[tri[2]]);

        Vec3 faceN = Normalize(Cross(Sub(v1.world, v0.world), Sub(v2.world, v0.world)));
        if (Dot(faceN, viewDir) <= 0.0f) {
            continue;
        }
        Vec3 n0 = normals[tri[0]];
        Vec3 n1 = normals[tri[1]];
        Vec3 n2 = normals[tri[2]];

        float minPx = std::floor(std::min({v0.sx, v1.sx, v2.sx}));
        float maxPx = std::ceil(std::max({v0.sx, v1.sx, v2.sx}));
        float minPy = std::floor(std::min({v0.sy, v1.sy, v2.sy}));
        float maxPy = std::ceil(std::max({v0.sy, v1.sy, v2.sy}));

        int x0 = static_cast<int>(std::clamp(minPx, 0.0f, static_cast<float>(w - 1)));
        int x1 = static_cast<int>(std::clamp(maxPx, 0.0f, static_cast<float>(w - 1)));
        int y0 = static_cast<int>(std::clamp(minPy, 0.0f, static_cast<float>(h - 1)));
        int y1 = static_cast<int>(std::clamp(maxPy, 0.0f, static_cast<float>(h - 1)));

        float denom = (v1.sy - v2.sy) * (v0.sx - v2.sx) + (v2.sx - v1.sx) * (v0.sy - v2.sy);
        if (std::fabs(denom) < 1e-6f) continue;

        for (int y = y0; y <= y1; ++y) {
            for (int x = x0; x <= x1; ++x) {
                float px = static_cast<float>(x) + 0.5f;
                float py = static_cast<float>(y) + 0.5f;

                float w0 = ((v1.sy - v2.sy) * (px - v2.sx) + (v2.sx - v1.sx) * (py - v2.sy)) / denom;
                float w1 = ((v2.sy - v0.sy) * (px - v2.sx) + (v0.sx - v2.sx) * (py - v2.sy)) / denom;
                float w2 = 1.0f - w0 - w1;

                if (w0 < 0.0f || w1 < 0.0f || w2 < 0.0f) continue;

                float depth = v0.depth * w0 + v1.depth * w1 + v2.depth * w2;
                int idx = y * w + x;
                if (depth <= zbuf[idx]) continue;

                Vec3 n = Normalize({
                    n0.x * w0 + n1.x * w1 + n2.x * w2,
                    n0.y * w0 + n1.y * w1 + n2.y * w2,
                    n0.z * w0 + n1.z * w1 + n2.z * w2
                });

                float shade = std::clamp(0.25f + 0.75f * std::max(0.0f, Dot(n, lightDir)), 0.0f, 1.0f);
                uint8_t baseR = 220;
                uint8_t baseG = 200;
                uint8_t baseB = 190;
                uint8_t r = static_cast<uint8_t>(baseR * shade);
                uint8_t g = static_cast<uint8_t>(baseG * shade);
                uint8_t b = static_cast<uint8_t>(baseB * shade);

                zbuf[idx] = depth;
                int pix = idx * 4;
                img[pix + 0] = r;
                img[pix + 1] = g;
                img[pix + 2] = b;
                img[pix + 3] = 255;
            }
        }
    }

    return stbi_write_png(outPath.c_str(), w, h, 4, img.data(), w * 4) != 0;
}

int main(int argc, char** argv) {
    Args args;
    if (!ParseArgs(argc, argv, args)) {
        PrintUsage();
        return 1;
    }
    gVerbose = args.verbose;

    fs::path bodySlideRoot = args.dataRoot;
    fs::path presetsDir = bodySlideRoot / "SliderPresets";
    fs::path sliderSetsDir = bodySlideRoot / "SliderSets";
    fs::path shapeDataRoot = bodySlideRoot / "ShapeData";

    Preset preset;
    if (!FindPreset(presetsDir, args.presetName, args.presetFile, preset)) {
        std::cerr << "Preset not found: " << args.presetName << "\n";
        return 2;
    }

    std::string sliderSetName = args.sliderSetName.empty() ? preset.setName : args.sliderSetName;
    SliderSet sliderSet;
    if (!FindSliderSetFile(sliderSetsDir, sliderSetName, sliderSet)) {
        std::cerr << "Slider set not found: " << sliderSetName << "\n";
        return 3;
    }

    std::cout << "Preset: " << preset.name << "\n";
    std::cout << "Slider set: " << sliderSet.name << "\n";
    std::cout << "Data folder: " << sliderSet.dataFolder << "\n";
    std::cout << "Source NIF: " << sliderSet.sourceFile << "\n";
    std::cout << "Shapes: " << sliderSet.shapes.size() << ", sliders: " << sliderSet.sliders.size() << "\n";

    fs::path nifPath = shapeDataRoot / sliderSet.dataFolder / sliderSet.sourceFile;
    if (!fs::exists(nifPath)) {
        std::cerr << "NIF not found: " << nifPath.string() << "\n";
        return 4;
    }

    std::vector<MeshShape> shapes;
    if (!LoadMeshShapes(nifPath, sliderSet, shapes)) {
        std::cerr << "Failed to load base mesh from NIF.\n";
        return 5;
    }

    DiffDataSets diffData;
    BuildDiffDataSets(sliderSet, shapeDataRoot, diffData, args.verbose);

    bool sawZap = false;
    size_t nonZeroSliders = 0;
    for (auto& slider : sliderSet.sliders) {
        float val = GetPresetValue(preset, slider);
        if (val != 0.0f) nonZeroSliders++;
        if (slider.invert) val = 1.0f - val;

        for (auto& shape : shapes) {
            if (slider.zap && val > 0.0f) {
                sawZap = true;
                continue;
            }

            for (const auto& ddf : slider.dataFiles) {
                if (ddf.targetName != shape.targetName) continue;
                if (!slider.uv) {
                    if (args.verbose && !diffData.HasSet(ddf.dataName)) {
                        std::cerr << "Missing diff set: " << ddf.dataName << " (target " << ddf.targetName << ")\n";
                    }
                    diffData.ApplyDiff(ddf.dataName, ddf.targetName, val, shape.verts);
                }
            }

            if (slider.clamp && val > 0.0f) {
                for (const auto& ddf : slider.dataFiles) {
                    if (ddf.targetName != shape.targetName) continue;
                    diffData.ApplyClamp(ddf.dataName, ddf.targetName, shape.verts);
                }
            }
        }
    }

    std::cout << "Non-zero sliders applied: " << nonZeroSliders << "\n";

    if (sawZap) {
        std::cerr << "Warning: zap sliders detected; zaps are currently ignored in this renderer.\n";
    }

    std::vector<Vec3> allVerts;
    std::vector<std::array<uint32_t, 3>> allTris;
    uint32_t vertOffset = 0;

    for (const auto& shape : shapes) {
        for (const auto& v : shape.verts) {
            allVerts.push_back({v.x, v.y, v.z});
        }
        for (const auto& t : shape.tris) {
            allTris.push_back({vertOffset + t.p1, vertOffset + t.p2, vertOffset + t.p3});
        }
        vertOffset += static_cast<uint32_t>(shape.verts.size());
    }

    if (!RenderMesh(allVerts, allTris, args.size, args.outPath, args.yawDeg, args.pitchDeg, args.rollDeg)) {
        std::cerr << "Failed to render PNG.\n";
        return 6;
    }

    if (!args.exportGlbPath.empty()) {
        std::vector<Vec3> normals = ComputeVertexNormals(allVerts, allTris);
        if (!ExportGlb(args.exportGlbPath, allVerts, allTris, normals)) {
            std::cerr << "Failed to export GLB.\n";
            return 7;
        }
        std::cout << "Exported GLB: " << args.exportGlbPath << "\n";
    }

    std::cout << "Rendered: " << args.outPath << "\n";
    return 0;
}
