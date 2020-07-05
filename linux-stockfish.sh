#!/bin/sh
# installs linux stockfish 11 into ./stockfish and creates a symlink to the engine at ./stockfish/engine

# make the directory and enter it
mkdir -p "./stockfish"
cd "stockfish"
# download the zip
wget "https://stockfishchess.org/files/stockfish-11-linux.zip"
# unzip
unzip "stockfish-11-linux.zip"
# change if updated
BIN="stockfish_20011801_x64_modern"
# add execute permission
chmod +x "./stockfish-11-linux/Linux/$BIN"
# symlink to the executable
ln -s "./stockfish-11-linux/Linux/$BIN" "./engine"

