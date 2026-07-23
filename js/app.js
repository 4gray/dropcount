import { $, $$, ACCENT, DEFAULT_REPOSITORY, elements, state } from "./config.js";
import { currentContext, filteredReleases, prepareReleases } from "./data.js";
import {
  fetchRepository,
  getStoredToken,
  GitHubError,
  normalizeRepository,
  removeStoredToken,
  storeToken,
} from "./github.js";
import { hideNotice, showNotice } from "./notices.js";
import { renderAll, renderAssets, renderOSChips, renderReleases, renderVersionChart } from "./render.js";
import { SAMPLE_RELEASES } from "./sample-data.js";

function setSampleData(message = null) {
  state.releases = prepareReleases(SAMPLE_RELEASES);
  state.repo = DEFAULT_REPOSITORY;
  state.source = "sample";
  state.rate = null;
  state.scope = "all";
  state.assetOS = "All";
  if (message) showNotice(message);
  renderAll();
}

function setLiveData(releases, repo, rate) {
  state.releases = prepareReleases(releases);
  state.repo = repo;
  state.source = "live";
  state.rate = rate;
  state.scope = "all";
  state.assetOS = "All";
  renderAll();
}

function updateTokenUI() {
  const hasToken = Boolean(getStoredToken());
  elements.tokenTriggerLabel.textContent = hasToken ? "Token added" : "Add token";
  elements.removeToken.hidden = !hasToken;
}

async function loadRepository(value) {
  const repo = normalizeRepository(value);
  if (!repo) {
    showNotice("Enter a repository as owner/repo or paste its GitHub URL.");
    elements.repoInput.focus();
    return;
  }

  hideNotice();
  state.loading = true;
  elements.loadButton.disabled = true;
  $("span", elements.loadButton).textContent = "Loading…";
  elements.statusPill.classList.remove("live");
  elements.statusText.textContent = `Loading ${repo}…`;
  elements.dashboardTitle.textContent = repo;

  try {
    const { releases, rate } = await fetchRepository(repo);
    setLiveData(releases, repo, rate);
    elements.repoInput.value = repo;
    if (!state.releases.length) showNotice("This repository has no published releases with assets.");
  } catch (error) {
    if (error instanceof GitHubError) showNotice(error.message);
    else setSampleData("Fetch failed (network) — showing sample data");
  } finally {
    state.loading = false;
    elements.loadButton.disabled = false;
    $("span", elements.loadButton).textContent = "Load data";
  }
}

function bindDataControls() {
  elements.repoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadRepository(elements.repoInput.value);
  });
  $$(".example-repo").forEach((button) => {
    button.addEventListener("click", () => {
      elements.repoInput.value = button.dataset.repo;
      loadRepository(button.dataset.repo);
    });
  });
  elements.kindSelect.addEventListener("change", () => {
    state.kind = elements.kindSelect.value;
    renderAll();
  });
  elements.scopeSelect.addEventListener("change", () => {
    state.scope = elements.scopeSelect.value;
    state.assetOS = "All";
    renderAll();
  });
  elements.clearScope.addEventListener("click", () => {
    state.scope = "all";
    state.assetOS = "All";
    renderAll();
  });
}

function bindChartControls() {
  elements.versionChart.addEventListener("click", (event) => {
    const bar = event.target.closest(".version-bar");
    if (!bar) return;
    state.scope = state.scope === bar.dataset.tag ? "all" : bar.dataset.tag;
    state.assetOS = "All";
    renderAll();
  });
  $$('[data-chart-sort]').forEach((button) => {
    button.addEventListener("click", () => {
      state.chartSort = button.dataset.chartSort;
      $$('[data-chart-sort]').forEach((candidate) => {
        candidate.classList.toggle("active", candidate === button);
      });
      renderVersionChart(filteredReleases());
    });
  });
}

function bindAssetControls() {
  elements.osFilterChips.addEventListener("click", (event) => {
    const chip = event.target.closest(".filter-chip");
    if (!chip) return;
    state.assetOS = chip.dataset.os;
    const { assets } = currentContext();
    renderOSChips(assets);
    renderAssets(assets, false);
  });
  elements.assetSearch.addEventListener("input", () => {
    state.assetSearch = elements.assetSearch.value;
    renderAssets(currentContext().assets, false);
  });
  elements.assetLimit.addEventListener("change", () => {
    state.assetLimit = Number(elements.assetLimit.value);
    renderAssets(currentContext().assets, false);
  });
  $$('[data-release-sort]').forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.releaseSort;
      if (state.releaseSort.key === key) {
        state.releaseSort.direction = state.releaseSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.releaseSort = { key, direction: key === "version" ? "asc" : "desc" };
      }
      renderReleases(filteredReleases());
    });
  });
}

function bindTokenControls() {
  elements.dismissNotice.addEventListener("click", hideNotice);
  elements.tokenTrigger.addEventListener("click", () => {
    elements.tokenInput.value = getStoredToken();
    elements.tokenDialog.showModal();
    requestAnimationFrame(() => elements.tokenInput.focus());
  });
  elements.tokenClose.addEventListener("click", () => elements.tokenDialog.close());
  elements.tokenForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const token = elements.tokenInput.value.trim();
    try {
      storeToken(token);
      updateTokenUI();
      elements.tokenDialog.close();
      showNotice(token
        ? "Token saved in this browser. Future requests will use the higher authenticated limit."
        : "Token field was empty, so no token was saved.");
    } catch {
      showNotice("This browser blocked local storage, so the token could not be saved.");
    }
  });
  elements.removeToken.addEventListener("click", () => {
    try {
      removeStoredToken();
      elements.tokenInput.value = "";
      updateTokenUI();
      elements.tokenDialog.close();
      showNotice("Stored token removed from this browser.");
    } catch {
      showNotice("This browser blocked access to local storage.");
    }
  });
}

function cacheElements() {
  Object.assign(elements, {
    repoForm: $("#repo-form"), repoInput: $("#repo-input"), loadButton: $("#load-button"),
    notice: $("#notice"), noticeText: $("#notice-text"), dismissNotice: $("#dismiss-notice"),
    statusPill: $("#status-pill"), statusText: $("#status-text"), dashboardTitle: $("#dashboard-title"),
    kindSelect: $("#kind-select"), scopeSelect: $("#scope-select"), hiddenPill: $("#hidden-pill"),
    clearScope: $("#clear-scope"), kpiGrid: $("#kpi-grid"), versionChart: $("#version-chart"),
    chartCoverage: $("#chart-coverage"),
    osBreakdown: $("#os-breakdown"), archBreakdown: $("#arch-breakdown"), formatBreakdown: $("#format-breakdown"),
    osFilterChips: $("#os-filter-chips"), assetSearch: $("#asset-search"), assetLimit: $("#asset-limit"),
    assetTable: $("#asset-table"), releasesBody: $("#releases-body"), tokenTrigger: $("#token-trigger"),
    tokenTriggerLabel: $("#token-trigger-label"), tokenDialog: $("#token-dialog"), tokenForm: $("#token-form"),
    tokenInput: $("#token-input"), tokenClose: $("#token-close"), removeToken: $("#remove-token"),
  });
}

function init() {
  cacheElements();
  elements.repoInput.value = DEFAULT_REPOSITORY;
  document.documentElement.style.setProperty("--accent", ACCENT);
  bindDataControls();
  bindChartControls();
  bindAssetControls();
  bindTokenControls();
  updateTokenUI();
  setSampleData();
  loadRepository(DEFAULT_REPOSITORY);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app remains fully usable when service workers are unavailable.
    });
  });
}

init();
