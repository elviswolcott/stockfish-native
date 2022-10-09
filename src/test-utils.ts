export function getStockfishBinPath(platform: NodeJS.Platform): string {
  if (platform === "win32") {
    return "./stockfish/engine.exe";
  }

  return "./stockfish/engine";
}

export function getNullDevicePath(platform: NodeJS.Platform): string {
  if (platform === "win32") {
    return "NUL";
  }

  return "/dev/null";
}
