// NifLoader.cs - compile into NifLoader.dll and copy alongside your app
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Threading.Tasks;
using NiflySharp;
using NiflySharp.Blocks;
using NiflySharp.Structs;

public class NifReader
{
    // Called by electron-edge-js
    public async Task<object> Invoke(dynamic input)
    {
        string filePath = (string)input.filePath;
        var nif = new NifFile();
        if (nif.Load(filePath) != 0)
            return new { error = "Could not load file" };

        var meshes = new List<object>();
        // Extract all TriShapes (static geometry)
        foreach (var shape in nif.Blocks.OfType<BSTriShape>())
        {
            var vertices = shape.VertexPositions   // List<Vector3>
                .Select(v => new[] { v.X, v.Y, v.Z }).ToArray();
            var normals = shape.Normals
                .Select(n => new[] { n.X, n.Y, n.Z }).ToArray();
            // Invert V coordinate because NIF uses top‑left origin
            var uvs = shape.UVs
                .Select(uv => new[] { uv.U, 1.0f - uv.V }).ToArray();
            var indices = shape.Triangles
                .SelectMany(t => new[] { (int)t.V1, (int)t.V2, (int)t.V3 })
                .ToArray();

            meshes.Add(new { vertices, normals, uvs, indices });
        }
        return new { meshes };
    }
}
