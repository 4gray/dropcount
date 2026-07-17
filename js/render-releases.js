import { $, $$, createElement, elements, state } from "./config.js";
import { formatCompact, formatDate, formatExact, percent, releaseTotal } from "./data.js";

export function renderReleases(releases) {
  const total = releases.reduce((sum, release) => sum + releaseTotal(release), 0);
  const sorted = [...releases].sort((a, b) => {
    let comparison = 0;
    if (state.releaseSort.key === "version") {
      comparison = a.tag_name.localeCompare(b.tag_name, undefined, { numeric: true, sensitivity: "base" });
    }
    if (state.releaseSort.key === "date") comparison = new Date(a.published_at) - new Date(b.published_at);
    if (state.releaseSort.key === "downloads") comparison = releaseTotal(a) - releaseTotal(b);
    return state.releaseSort.direction === "asc" ? comparison : -comparison;
  });

  const fragment = document.createDocumentFragment();
  sorted.forEach((release) => {
    const downloads = releaseTotal(release);
    const share = percent(downloads, total);
    const row = document.createElement("tr");
    const versionCell = document.createElement("td");
    versionCell.append(createElement("span", "release-version", release.tag_name));
    if (release.prerelease) versionCell.append(createElement("span", "prerelease-badge", "Pre"));

    const downloadsCell = createElement("td", "", formatCompact(downloads));
    downloadsCell.title = formatExact(downloads);
    const shareCellTD = document.createElement("td");
    const shareCell = createElement("div", "share-cell");
    const track = createElement("span", "share-track");
    const fill = createElement("span", "share-fill");
    fill.style.setProperty("--width", share);
    track.append(fill);
    shareCell.append(track, createElement("span", "", `${share.toFixed(1)}%`));
    shareCellTD.append(shareCell);
    row.append(
      versionCell,
      createElement("td", "release-date", formatDate(release.published_at)),
      createElement("td", "release-assets", String(release.assets.length)),
      downloadsCell,
      shareCellTD,
    );
    fragment.append(row);
  });

  if (!sorted.length) {
    const row = document.createElement("tr");
    const cell = createElement("td", "release-date", "No releases have assets in this filter.");
    cell.colSpan = 5;
    row.append(cell);
    fragment.append(row);
  }
  elements.releasesBody.replaceChildren(fragment);

  $$('[data-release-sort]').forEach((button) => {
    const active = button.dataset.releaseSort === state.releaseSort.key;
    button.classList.toggle("active", active);
    $("span", button).textContent = active ? (state.releaseSort.direction === "asc" ? "↑" : "↓") : "";
  });
}
