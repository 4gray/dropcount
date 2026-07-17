import { ACCENT, createElement, elements, OS_COLORS, state } from "./config.js";
import { aggregate, formatCompact, formatExact } from "./data.js";

export function renderOSChips(assets) {
  const detected = aggregate(assets, "os").map((item) => item.name);
  const options = ["All", ...detected];
  if (!options.includes(state.assetOS)) state.assetOS = "All";
  const fragment = document.createDocumentFragment();
  options.forEach((os) => {
    const active = state.assetOS === os;
    const button = createElement("button", `filter-chip${active ? " active" : ""}`, os);
    button.type = "button";
    button.dataset.os = os;
    button.style.setProperty("--chip-color", os === "All" ? ACCENT : OS_COLORS[os] || OS_COLORS.Other);
    button.setAttribute("aria-pressed", String(active));
    fragment.append(button);
  });
  elements.osFilterChips.replaceChildren(fragment);
}

export function renderAssets(assets, rebuildChips = true) {
  if (rebuildChips) renderOSChips(assets);
  const query = state.assetSearch.trim().toLowerCase();
  const matches = assets
    .filter((asset) => state.assetOS === "All" || asset.os === state.assetOS)
    .filter((asset) => !query || asset.name.toLowerCase().includes(query))
    .sort((a, b) => b.download_count - a.download_count)
    .slice(0, state.assetLimit);

  const fragment = document.createDocumentFragment();
  const header = createElement("div", "asset-row header");
  ["Asset filename", "OS", "Arch", "Format", "Downloads"].forEach((text) => {
    header.append(createElement("span", "", text));
  });
  fragment.append(header);

  if (!matches.length) {
    const empty = createElement("div", "empty-state", "No assets match this platform and filename filter.");
    empty.style.margin = "14px";
    fragment.append(empty);
    elements.assetTable.replaceChildren(fragment);
    return;
  }

  const max = Math.max(...matches.map((asset) => asset.download_count), 1);
  matches.forEach((asset) => {
    const row = createElement("div", "asset-row");
    const name = asset.browser_download_url
      ? createElement("a", "asset-name", asset.name)
      : createElement("span", "asset-name", asset.name);
    if (name instanceof HTMLAnchorElement) {
      name.href = asset.browser_download_url;
      name.target = "_blank";
      name.rel = "noreferrer";
    }
    name.title = `${asset.name} · ${asset.releaseTag}`;

    const os = createElement("span", "asset-os asset-muted", asset.os);
    os.style.setProperty("--os-color", OS_COLORS[asset.os] || OS_COLORS.Other);
    const downloads = createElement("span", "download-cell");
    const count = createElement("span", "", formatCompact(asset.download_count));
    count.title = formatExact(asset.download_count);
    const track = createElement("span", "mini-track");
    const fill = createElement("span", "mini-fill");
    fill.style.setProperty("--width", (asset.download_count / max) * 100);
    track.append(fill);
    downloads.append(count, track);
    row.append(
      name,
      os,
      createElement("span", "asset-muted", asset.arch),
      createElement("span", "asset-muted", asset.format),
      downloads,
    );
    fragment.append(row);
  });
  elements.assetTable.replaceChildren(fragment);
}
