import { currentContext, filteredReleases } from "./data.js";
import { renderAssets, renderOSChips } from "./render-assets.js";
import {
  renderBreakdowns,
  renderFilterSummary,
  renderKPIs,
  renderScopeOptions,
  renderStatus,
  renderVersionChart,
} from "./render-dashboard.js";
import { renderReleases } from "./render-releases.js";

export { renderAssets, renderOSChips, renderReleases, renderVersionChart };

export function renderAll() {
  renderStatus();
  const releases = filteredReleases();
  renderScopeOptions(releases);
  const context = currentContext();
  renderFilterSummary();
  renderKPIs(context);
  renderVersionChart(context.releases);
  renderBreakdowns(context.assets);
  renderAssets(context.assets);
  renderReleases(context.releases);
}
