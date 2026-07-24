import { state } from "./config.js";
import { parseArch, parseFormat, parseKind, parseOS } from "./parsers.js";
import { releaseChannel } from "./versions.js";

export function prepareReleases(releases) {
  return releases
    .filter((release) => !release.draft)
    .map((release) => ({
      ...release,
      published_at: release.published_at || release.created_at,
      releaseChannel: releaseChannel(release),
      assets: (release.assets || []).map((asset) => {
        const format = parseFormat(asset.name || "");
        const os = parseOS(asset.name || "");
        return {
          ...asset,
          name: asset.name || "Unnamed asset",
          download_count: Number(asset.download_count) || 0,
          format,
          os,
          arch: parseArch(asset.name || "", os),
          kind: parseKind(asset.name || "", format),
        };
      }),
    }))
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
}

function keepAsset(asset) {
  if (state.kind === "all") return true;
  if (state.kind === "installers") return asset.kind === "installer" || asset.kind === "binary";
  return asset.kind === "installer" || asset.kind === "archive" || asset.kind === "binary";
}

export function filteredReleases() {
  return state.releases
    .map((release) => ({ ...release, assets: release.assets.filter(keepAsset) }))
    .filter((release) => release.assets.length > 0);
}

export function releaseTotal(release) {
  return release.assets.reduce((sum, asset) => sum + asset.download_count, 0);
}

export function mostDownloadedRelease(releases) {
  return [...releases].sort((left, right) => {
    const downloads = releaseTotal(right) - releaseTotal(left);
    if (downloads) return downloads;
    return new Date(right.published_at) - new Date(left.published_at);
  })[0] || null;
}

export function allAssets(releases) {
  return releases.flatMap((release) =>
    release.assets.map((asset) => ({ ...asset, releaseTag: release.tag_name })),
  );
}

export function aggregate(assets, key) {
  const totals = new Map();
  assets.forEach((asset) => {
    totals.set(asset[key], (totals.get(asset[key]) || 0) + asset.download_count);
  });
  return [...totals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function formatCompact(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1_000) return `${Math.round(number / 1_000)}K`;
  return String(number);
}

export function formatExact(value) {
  return (Number(value) || 0).toLocaleString("en-US");
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function percent(part, total) {
  return total ? (part / total) * 100 : 0;
}

export function currentContext() {
  const releases = filteredReleases();
  const scopedRelease = state.scope === "all"
    ? null
    : releases.find((release) => release.tag_name === state.scope);
  const scopedReleases = scopedRelease ? [scopedRelease] : releases;
  return {
    releases,
    scopedRelease,
    scopedReleases,
    assets: allAssets(scopedReleases),
  };
}
