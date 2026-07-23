import test from "node:test";
import assert from "node:assert/strict";

import { fetchRepository } from "../js/github.js";

function response({ body, link = null, remaining }) {
  const headers = new Map([
    ["link", link],
    ["x-ratelimit-limit", "60"],
    ["x-ratelimit-remaining", remaining],
  ]);
  return {
    ok: true,
    status: 200,
    headers: { get: (name) => headers.get(name.toLowerCase()) ?? null },
    json: async () => body,
  };
}

test("follows GitHub release pagination and reports the final rate limit", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    if (calls.length === 1) {
      return response({
        body: [{ id: 1, tag_name: "v2.0.0" }],
        link: '<https://api.github.com/repos/example/project/releases?per_page=100&page=2>; rel="next", <https://api.github.com/repos/example/project/releases?per_page=100&page=2>; rel="last"',
        remaining: "58",
      });
    }
    return response({
      body: [{ id: 2, tag_name: "v1.0.0-beta.1", prerelease: true }],
      remaining: "57",
    });
  };

  const result = await fetchRepository("example/project");

  assert.equal(calls.length, 2);
  assert.equal(
    calls[0],
    "https://api.github.com/repos/example/project/releases?per_page=100",
  );
  assert.equal(
    calls[1],
    "https://api.github.com/repos/example/project/releases?per_page=100&page=2",
  );
  assert.deepEqual(result.releases.map((release) => release.tag_name), [
    "v2.0.0",
    "v1.0.0-beta.1",
  ]);
  assert.deepEqual(result.rate, { remaining: "57", limit: "60" });
});
