import test from "node:test";
import assert from "node:assert/strict";

import { mostDownloadedRelease } from "../js/data.js";

function release(tag, downloads, publishedAt) {
  return {
    tag_name: tag,
    published_at: publishedAt,
    assets: downloads.map((download_count) => ({ download_count })),
  };
}

test("returns the release with the highest combined asset downloads", () => {
  const releases = [
    release("v1.0.0", [100, 200], "2026-01-01T00:00:00Z"),
    release("v2.0.0-beta.1", [250, 500], "2026-02-01T00:00:00Z"),
    release("nightly", [50], "2026-03-01T00:00:00Z"),
  ];

  assert.equal(mostDownloadedRelease(releases).tag_name, "v2.0.0-beta.1");
});

test("uses the newest release when download totals are tied", () => {
  const releases = [
    release("v1.0.0", [300], "2026-01-01T00:00:00Z"),
    release("v1.1.0", [100, 200], "2026-02-01T00:00:00Z"),
  ];

  assert.equal(mostDownloadedRelease(releases).tag_name, "v1.1.0");
  assert.equal(mostDownloadedRelease([]), null);
});
