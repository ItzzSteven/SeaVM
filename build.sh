#!/bin/bash


echo "========================================"
echo "    SeaVM: compiling...      "
echo "========================================"


if ! command -v node &> /dev/null; then
    echo "[SeaVM] Node.js not found. Triggering installer..."
    chmod +x get_build_tools.sh
    ./get_build_tools.sh
fi


if ! command -v emcc &> /dev/null; then
    echo "[SeaVM] Compiler (emcc) not found in PATH."
    
    if [ -d "emsdk" ]; then
        echo "[SeaVM] emsdk folder found. Activating..."
        source emsdk/emsdk_env.sh
    else
        echo "[SeaVM] No compiler found. Running full tool setup..."
        chmod +x get_build_tools.sh
        ./get_build_tools.sh
        

        if [ -f "emsdk/emsdk_env.sh" ]; then
            source emsdk/emsdk_env.sh
        else
            echo "Error: get_build_tools.sh failed to create emsdk folder."
            exit 1
        fi
    fi
fi


if ! command -v emcc &> /dev/null; then
    echo "Fatal Error: Emscripten could not be activated."
    exit 1
fi


if [ -d "dist" ]; then
    rm -rf dist
fi


node seavm.js


if [ -f "dist/index.html" ]; then
    echo "----------------------------------------"
    echo "Build Success: output in dist"
    echo "----------------------------------------"
else
    echo "Build failed. Check the C++ errors above."
fi
