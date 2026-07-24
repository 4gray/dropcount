import { $$, createElement, elements, OS_COLORS, PALETTE, state } from "./config.js";
import {
  aggregate,
  formatCompact,
  formatDate,
  formatExact,
  mostDownloadedRelease,
  percent,
  releaseTotal,
} from "./data.js";
import { releaseChannelLabel } from "./versions.js";

const VERSION_CHART_LIMIT = 16;

export function renderStatus() {
  const isLive = state.source === "live";
  elements.statusPill.classList.toggle("live", isLive);
  if (!isLive) {
    elements.statusText.textContent = "Sample data — enter a repo and press Load";
    elements.dashboardTitle.replaceChildren(
      document.createTextNode(state.repo),
      createElement("span", "", " / sample"),
    );
    return;
  }

  const hasRate = state.rate?.remaining != null && state.rate?.limit != null;
  const rateText = hasRate
    ? ` · ${state.rate.remaining}/${state.rate.limit} GitHub API calls left this hour`
    : "";
  elements.statusText.textContent = `Live · ${state.releases.length} releases${rateText}`;
  elements.dashboardTitle.textContent = state.repo;
}

export function renderScopeOptions(releases) {
  const activeTags = new Set(releases.map((release) => release.tag_name));
  if (state.scope !== "all" && !activeTags.has(state.scope)) state.scope = "all";

  const fragment = document.createDocumentFragment();
  fragment.append(new Option("All versions", "all"));
  releases.forEach((release) => {
    fragment.append(new Option(
      `${release.tag_name}  ·  ${formatCompact(releaseTotal(release))}`,
      release.tag_name,
    ));
  });
  elements.scopeSelect.replaceChildren(fragment);
  elements.scopeSelect.value = state.scope;
}

export function renderFilterSummary() {
  const hiddenCount = state.releases
    .flatMap((release) => release.assets)
    .filter((asset) => asset.kind === "metadata" || asset.kind === "checksum").length;
  elements.hiddenPill.hidden = state.kind === "all" || hiddenCount === 0;
  elements.hiddenPill.textContent = `${hiddenCount} metadata/checksum ${hiddenCount === 1 ? "file" : "files"} hidden`;
  elements.clearScope.hidden = state.scope === "all";
  $$('[data-scope-label]').forEach((label) => {
    label.textContent = state.scope === "all" ? "All versions" : state.scope;
  });
}

export function renderPopularRelease(releases) {
  const popular = mostDownloadedRelease(releases);
  elements.popularRelease.hidden = !popular;
  if (!popular) {
    elements.popularRelease.replaceChildren();
    return;
  }

  const downloads = releaseTotal(popular);
  const allDownloads = releases.reduce((sum, release) => sum + releaseTotal(release), 0);
  const share = percent(downloads, allDownloads);
  const copy = createElement("span", "popular-release-copy");
  const signal = createElement("span", "popular-release-signal");
  signal.append(
    createElement("span", "popular-release-pulse"),
    document.createTextNode("Most downloaded release"),
  );

  const title = createElement("span", "popular-release-title");
  title.append(createElement("strong", "", popular.tag_name));
  if (popular.releaseChannel) {
    title.append(
      createElement("span", "prerelease-badge", releaseChannelLabel(popular.releaseChannel)),
    );
  }
  copy.append(
    signal,
    title,
    createElement(
      "span",
      "popular-release-meta",
      `${formatDate(popular.published_at)} · ${popular.assets.length} distributable assets`,
    ),
  );

  const stats = createElement("span", "popular-release-stats");
  stats.append(
    createElement("span", "popular-release-stat-label", "Lifetime downloads"),
    createElement("strong", "", formatCompact(downloads)),
    createElement(
      "span",
      "popular-release-exact",
      `${formatExact(downloads)} exact · ${share.toFixed(1)}% of all downloads`,
    ),
  );
  const shareTrack = createElement("span", "popular-release-share");
  const shareFill = createElement("span", "");
  shareFill.style.setProperty("--width", share);
  shareTrack.append(shareFill);
  stats.append(shareTrack);

  const action = createElement("span", "popular-release-action");
  action.append(
    createElement("span", "", state.scope === popular.tag_name ? "Show all" : "Explore release"),
    createElement("strong", "", state.scope === popular.tag_name ? "↙" : "↗"),
  );

  elements.popularRelease.dataset.tag = popular.tag_name;
  elements.popularRelease.classList.toggle("is-selected", state.scope === popular.tag_name);
  elements.popularRelease.setAttribute(
    "aria-label",
    `${popular.tag_name}, most downloaded release with ${formatExact(downloads)} downloads. ${
      state.scope === popular.tag_name ? "Show all versions." : "Scope dashboard to this release."
    }`,
  );
  elements.popularRelease.replaceChildren(copy, stats, action);
}

export function renderKPIs({ releases, scopedRelease, assets }) {
  const total = assets.reduce((sum, asset) => sum + asset.download_count, 0);
  let metrics;

  if (scopedRelease) {
    const topOS = aggregate(assets, "os")[0];
    metrics = [
      ["Version downloads", formatCompact(total), `${formatExact(total)} lifetime downloads`],
      ["Assets", formatCompact(assets.length), `${scopedRelease.tag_name} distributable files`],
      ["Avg / asset", formatCompact(assets.length ? Math.round(total / assets.length) : 0), "Mean lifetime downloads"],
      ["Top platform", topOS?.name || "—", topOS ? `${percent(topOS.count, total).toFixed(1)}% of version downloads` : "No detected platform"],
    ];
  } else {
    const latest = [...releases].sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0];
    metrics = [
      ["Total downloads", formatCompact(total), `${formatExact(total)} lifetime downloads`],
      ["Releases", formatCompact(releases.length), releases[0] ? `Latest: ${releases[0].tag_name}` : "No releases"],
      ["Assets", formatCompact(assets.length), "Across all visible releases"],
      ["Latest release", formatCompact(latest ? releaseTotal(latest) : 0), latest ? `${latest.tag_name} · ${formatDate(latest.published_at)}` : "No release data"],
    ];
  }

  const fragment = document.createDocumentFragment();
  metrics.forEach(([label, value, note], index) => {
    const card = createElement("article", "kpi-card");
    card.dataset.index = `0${index + 1}`;
    card.style.animationDelay = `${index * 45}ms`;
    card.append(createElement("div", "kpi-label", label));
    const valueElement = createElement("div", "kpi-value", value);
    valueElement.title = note;
    card.append(valueElement, createElement("div", "kpi-note", note));
    fragment.append(card);
  });
  elements.kpiGrid.replaceChildren(fragment);
}

export function renderVersionChart(releases) {
  let visible = [...releases]
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, VERSION_CHART_LIMIT);
  elements.chartCoverage.textContent = releases.length > visible.length
    ? `Latest ${visible.length} of ${releases.length} releases`
    : `${visible.length} ${visible.length === 1 ? "release" : "releases"}`;
  visible = state.chartSort === "chronological"
    ? visible.sort((a, b) => new Date(a.published_at) - new Date(b.published_at))
    : visible.sort((a, b) => releaseTotal(b) - releaseTotal(a));

  const max = Math.max(...visible.map(releaseTotal), 1);
  const fragment = document.createDocumentFragment();
  visible.forEach((release) => {
    const total = releaseTotal(release);
    const button = createElement("button", "version-bar");
    button.type = "button";
    button.dataset.tag = release.tag_name;
    button.classList.toggle("selected", state.scope === release.tag_name);
    button.title = `${release.tag_name} · ${formatExact(total)} downloads`;
    button.setAttribute("aria-label", `${release.tag_name}, ${formatExact(total)} downloads. Click to scope dashboard.`);

    const track = createElement("span", "version-bar-track");
    const fill = createElement("span", "version-bar-fill");
    fill.style.setProperty("--bar-height", (total / max) * 100);
    track.append(fill);
    button.append(track, createElement("span", "version-bar-label", release.tag_name));
    fragment.append(button);
  });

  elements.versionChart.classList.toggle("has-selection", state.scope !== "all");
  elements.versionChart.replaceChildren(fragment);
  if (!visible.length) {
    elements.versionChart.append(createElement("div", "empty-state", "No releases have assets in this filter."));
  }
}

function renderBreakdown(container, items, colorFor) {
  if (!items.length) {
    container.replaceChildren(createElement("div", "empty-state", "No matching assets to break down."));
    return;
  }
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => {
    const color = colorFor(item, index);
    const row = createElement("div", "breakdown-row");
    row.title = `${item.name}: ${formatExact(item.count)} downloads`;
    const meta = createElement("div", "breakdown-meta");
    const name = createElement("span", "breakdown-name");
    const swatch = createElement("span", "swatch");
    swatch.style.setProperty("--swatch", color);
    name.append(swatch, document.createTextNode(item.name));
    meta.append(
      name,
      createElement("span", "breakdown-count", formatCompact(item.count)),
      createElement("span", "breakdown-percent", `${percent(item.count, total).toFixed(1)}%`),
    );
    const track = createElement("div", "breakdown-track");
    const fill = createElement("div", "breakdown-fill");
    fill.style.setProperty("--width", percent(item.count, total));
    fill.style.setProperty("--swatch", color);
    track.append(fill);
    row.append(meta, track);
    fragment.append(row);
  });
  container.replaceChildren(fragment);
}

export function renderBreakdowns(assets) {
  renderBreakdown(elements.osBreakdown, aggregate(assets, "os"), (item) => OS_COLORS[item.name] || OS_COLORS.Other);
  renderBreakdown(elements.archBreakdown, aggregate(assets, "arch"), (_, index) => PALETTE[index % PALETTE.length]);
  renderBreakdown(elements.formatBreakdown, aggregate(assets, "format"), (_, index) => PALETTE[index % PALETTE.length]);
}
