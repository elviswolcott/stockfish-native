# NOTE: This script has to be run in an Admin PowerShell window or else it will fail.
# Installs Windows Stockfish 11 into ./stockfish-win and creates a symlink to the engine at ./stockfish-win/engine.exe

$SF_DIR = "./stockfish-win"
$BIN = "stockfish_20011801_x64_modern.exe"

# make the directory
New-Item -ItemType Directory -Path $SF_DIR
# download the zip
Invoke-WebRequest -Uri "https://stockfishchess.org/files/stockfish-11-win.zip" -OutFile "$SF_DIR/stockfish-11-win.zip"
# unzip
Expand-Archive -Path "$SF_DIR/stockfish-11-win.zip" -DestinationPath "$SF_DIR/."
# symlink to the executable
New-Item -ItemType SymbolicLink -Value "$SF_DIR/stockfish-11-win/Windows/$BIN" -Path "$SF_DIR/engine.exe" -Force
