cmake_minimum_required(VERSION 3.16)

project(bsrender LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(THIRD_PARTY_DIR ${CMAKE_CURRENT_LIST_DIR}/third_party)

add_subdirectory(${THIRD_PARTY_DIR}/nifly ${CMAKE_BINARY_DIR}/nifly)
add_subdirectory(${THIRD_PARTY_DIR}/tinyxml2 ${CMAKE_BINARY_DIR}/tinyxml2)

add_executable(bsrender
    src/main.cpp
)

target_include_directories(bsrender PRIVATE
    ${THIRD_PARTY_DIR}/stb
)

target_link_libraries(bsrender PRIVATE
    nifly
    tinyxml2
)

if(MSVC)
    target_compile_options(bsrender PRIVATE /W4)
else()
    target_compile_options(bsrender PRIVATE -Wall -Wextra -Wpedantic)
endif()
