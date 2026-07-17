export const ACCENT = "#f6a04d";

export const OS_COLORS = {
  macOS: "#b98cff",
  Windows: "#4c8dff",
  Linux: "#f2c14e",
  Android: "#35c88a",
  FreeBSD: "#ff8a5c",
  Other: "#8892a1",
};

export const PALETTE = [
  ACCENT,
  "#4c8dff",
  "#f2c14e",
  "#b98cff",
  "#ff8a5c",
  "#ff6b9d",
  "#3fd0d8",
  "#8892a1",
];

export const TOKEN_KEY = "dropcount_token";
export const DEFAULT_REPOSITORY = "4gray/iptvnator";

export const state = {
  releases: [],
  repo: DEFAULT_REPOSITORY,
  source: "sample",
  rate: null,
  kind: "distributable",
  scope: "all",
  chartSort: "chronological",
  assetOS: "All",
  assetSearch: "",
  assetLimit: 10,
  releaseSort: { key: "date", direction: "desc" },
  loading: false,
};

export const elements = {};

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
