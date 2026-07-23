import test from "node:test";
import assert from "node:assert/strict";

import {
  compareVersionTags,
  parseVersionTag,
  releaseChannel,
  releaseChannelLabel,
} from "../js/versions.js";

test("extracts SemVer from prefixed and suffixed release tags", () => {
  assert.deepEqual(parseVersionTag("desktop-v2.4.0-rc.2+macos"), {
    major: "2",
    minor: "4",
    patch: "0",
    prerelease: ["rc", "2"],
    build: ["macos"],
  });
  assert.deepEqual(parseVersionTag("app-v1.0.0-7"), {
    major: "1",
    minor: "0",
    patch: "0",
    prerelease: ["7"],
    build: [],
  });
});

test("sorts recognized tags using SemVer precedence", () => {
  const tags = [
    "v1.0.0",
    "v1.0.0-rc.1",
    "app-v1.0.0-beta.2",
    "v0.22.0",
    "app-v1.0.0-alpha",
  ];

  assert.deepEqual(tags.sort(compareVersionTags), [
    "v0.22.0",
    "app-v1.0.0-alpha",
    "app-v1.0.0-beta.2",
    "v1.0.0-rc.1",
    "v1.0.0",
  ]);
});

test("keeps arbitrary release formats sortable instead of rejecting them", () => {
  const tags = ["release-2026.10", "nightly", "release-2026.2"];
  assert.deepEqual(tags.sort(compareVersionTags), [
    "nightly",
    "release-2026.2",
    "release-2026.10",
  ]);
});

test("recognizes GitHub prereleases and common alpha, beta, and rc tags", () => {
  assert.equal(releaseChannel({ tag_name: "v2.0.0-alpha.1" }), "alpha");
  assert.equal(releaseChannel({ tag_name: "release-2.0.0beta2" }), "beta");
  assert.equal(releaseChannel({ tag_name: "v2.0.0-rc.3" }), "rc");
  assert.equal(releaseChannel({ tag_name: "custom-build", prerelease: true }), "pre");
  assert.equal(releaseChannel({ tag_name: "v2.0.0" }), null);
  assert.equal(releaseChannelLabel("rc"), "RC");
});
