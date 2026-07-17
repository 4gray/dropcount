import { DEFAULT_REPOSITORY } from "./config.js";

function sampleAsset(tag, name, downloadCount, size = 86_000_000, contentType = "application/octet-stream") {
  return {
    name,
    download_count: downloadCount,
    size,
    content_type: contentType,
    browser_download_url: `https://github.com/${DEFAULT_REPOSITORY}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`,
  };
}

function sampleRelease(tag, publishedAt, counts, metadata = null) {
  const version = tag.replace(/^v/, "");
  const assets = [
    sampleAsset(tag, `iptvnator-${version}-linux-amd64.deb`, counts[0]),
    sampleAsset(tag, `iptvnator-${version}-linux-x86_64.AppImage`, counts[1]),
    sampleAsset(tag, `iptvnator-${version}-linux-arm64.AppImage`, counts[2]),
    sampleAsset(tag, `iptvnator-${version}-mac-arm64.dmg`, counts[3]),
    sampleAsset(tag, `iptvnator-${version}-mac-x64.dmg`, counts[4]),
    sampleAsset(tag, `iptvnator-${version}-windows-x64-setup.exe`, counts[5]),
  ];
  if (metadata) {
    assets.push(
      sampleAsset(tag, "latest.yml", metadata[0], 374, "text/yaml"),
      sampleAsset(tag, "latest-mac.yml", metadata[1], 835, "text/yaml"),
      sampleAsset(tag, "latest-linux.yml", metadata[2], 887, "text/yaml"),
      sampleAsset(tag, `iptvnator-${version}-windows-x64-setup.exe.blockmap`, metadata[3], 190_599),
    );
  }
  return {
    tag_name: tag,
    name: `IPTVnator ${tag}`,
    published_at: publishedAt,
    created_at: publishedAt,
    draft: false,
    prerelease: false,
    assets,
  };
}

export const SAMPLE_RELEASES = [
  sampleRelease("v0.22.0", "2026-07-05T14:33:38Z", [1093, 518, 224, 2065, 532, 6911], [19641, 5276, 1273, 222]),
  sampleRelease("v0.21.0", "2026-05-06T20:36:52Z", [6730, 2851, 1275, 14280, 11829, 28479]),
  sampleRelease("v0.20.0", "2026-04-26T14:05:58Z", [1135, 574, 239, 2296, 2191, 5934]),
  sampleRelease("v0.19.0", "2026-02-19T12:32:39Z", [2885, 2335, 748, 7813, 4608, 16572]),
  sampleRelease("v0.18.0", "2026-01-14T18:50:00Z", [2208, 2354, 591, 3703, 1415, 15842]),
];
