import { TOKEN_KEY } from "./config.js";

export class GitHubError extends Error {}

function nextPageUrl(linkHeader) {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="([^"]+)"/);
    if (match?.[2].split(/\s+/).includes("next")) return match[1];
  }
  return null;
}

export function normalizeRepository(value) {
  let normalized = value.trim();
  normalized = normalized.replace(/^https?:\/\/(?:www\.)?github\.com\//i, "");
  normalized = normalized.replace(/\/+$/, "");
  return /^[\w.-]+\/[\w.-]+$/.test(normalized) ? normalized : null;
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function storeToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchRepository(repo) {
  const headers = { Accept: "application/vnd.github+json" };
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `https://api.github.com/repos/${repo}/releases?per_page=100`;
  let rate = null;
  const releases = [];

  while (url) {
    const response = await fetch(url, { headers });
    rate = {
      remaining: response.headers.get("x-ratelimit-remaining"),
      limit: response.headers.get("x-ratelimit-limit"),
    };

    if (!response.ok) {
      if (response.status === 404) throw new GitHubError("Repo not found — check owner/repo");
      if (response.status === 403) {
        throw new GitHubError("GitHub rate limit reached — try later (or add a token)");
      }
      throw new GitHubError(`GitHub error ${response.status}`);
    }

    const page = await response.json();
    if (!Array.isArray(page)) throw new GitHubError("GitHub returned an unexpected response");
    releases.push(...page);
    url = nextPageUrl(response.headers.get("link"));
  }

  return { releases, rate };
}
