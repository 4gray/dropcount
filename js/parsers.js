export function parseFormat(filename) {
  const name = filename.toLowerCase();
  if (/\.tar\.(gz|xz|zst|bz2)$|\.tgz$/.test(name)) {
    return name.endsWith(".tgz") ? "tgz" : "tar.gz";
  }
  const extension = name.match(/\.([a-z0-9]+)$/);
  return extension ? extension[1] : "binary";
}

export function parseOS(filename) {
  const name = filename.toLowerCase();
  if (/darwin|macos|osx|apple|\.dmg|\.pkg/.test(name)) return "macOS";
  if (/windows|win32|win64|winget|\.exe|\.msi|-win-|_win/.test(name)) return "Windows";
  if (/linux|\.deb|\.rpm|\.appimage|\.snap|_linux|-linux/.test(name)) return "Linux";
  if (/android|\.apk/.test(name)) return "Android";
  if (/freebsd/.test(name)) return "FreeBSD";
  return "Other";
}

export function parseArch(filename, os) {
  const name = filename.toLowerCase();
  if (/arm64|aarch64/.test(name)) return "arm64";
  if (/amd64|x86_64|x64|win64/.test(name)) return "x64";
  if (/armv7|armhf|armv6/.test(name)) return "arm";
  if (/386|i386|win32|x86(?!_64)/.test(name)) return "x86";
  if (/universal/.test(name)) return "universal";
  if (os === "macOS") return "universal";
  return "—";
}

export function parseKind(filename, format) {
  const name = filename.toLowerCase();
  const checksumFormats = ["sha256", "sha512", "sha1", "md5", "asc", "sig", "minisig", "pem", "gpg", "sbom", "sum", "cert"];
  const metadataFormats = ["yml", "yaml", "json", "xml", "blockmap", "txt", "md"];
  const installerFormats = ["dmg", "pkg", "exe", "msi", "deb", "rpm", "appimage", "snap", "apk", "nupkg", "flatpak"];
  const archiveFormats = ["zip", "tar.gz", "tgz", "gz", "xz", "zst", "bz2", "7z", "tar"];

  if (/checksums?|sha\d{3}|sha256sum|\.sbom/.test(name) || checksumFormats.includes(format)) return "checksum";
  if (name === "releases" || name.endsWith(".blockmap") || /^latest.*\.ya?ml$/.test(name)) return "metadata";
  if (metadataFormats.includes(format)) return "metadata";
  if (installerFormats.includes(format)) return "installer";
  if (archiveFormats.includes(format)) return "archive";
  if (format === "binary") return "binary";
  return "other";
}
