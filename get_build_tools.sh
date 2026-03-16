#!/bin/bash


echo "========================================"
echo "    SeaVM: Fetching Build Tools        "
echo "========================================"


if ! command -v node &> /dev/null; then
    echo "[SeaVM] Node.js not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then

        if command -v brew &> /dev/null; then
            brew install node
        else
            echo "Homebrew not found. Please install Node.js from https://nodejs.org"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then

        sudo apt-get update && sudo apt-get install -y nodejs npm
    else
        echo "Please install Node.js manually for your OS: https://nodejs.org"
        exit 1
    fi
else
    echo "[SeaVM] Node.js is already installed."
fi


if [ ! -d "emsdk" ]; then
    echo "[SeaVM] Cloning Emscripten SDK repository..."
    git clone https://github.com/emscripten-core/emsdk.git
fi

echo "[SeaVM] Configuring Emscripten environment..."
cd emsdk || exit
./emsdk install latest
./emsdk activate latest


source ./emsdk_env.sh
cd ..

echo "----------------------------------------"
echo "SUCCESS: SeaVM tools are ready."
echo "IMPORTANT: You MUST run 'source emsdk/emsdk_env.sh' in your"
echo "current terminal before running build.sh the first time."
echo "----------------------------------------"
