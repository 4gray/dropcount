const NATURAL_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const SEMVER_PATTERN = /v?(\d+)\.(\d+)\.(\d+)(?:-([0-9a-z-]+(?:\.[0-9a-z-]+)*))?(?:\+([0-9a-z-]+(?:\.[0-9a-z-]+)*))?/i;

const CHANNEL_LABELS = {
  alpha: "Alpha",
  beta: "Beta",
  rc: "RC",
  pre: "Pre",
};

function compareNumericStrings(left, right) {
  const normalizedLeft = left.replace(/^0+(?=\d)/, "");
  const normalizedRight = right.replace(/^0+(?=\d)/, "");
  if (normalizedLeft.length !== normalizedRight.length) {
    return normalizedLeft.length - normalizedRight.length;
  }
  return normalizedLeft.localeCompare(normalizedRight);
}

function comparePrerelease(left, right) {
  if (!left.length && !right.length) return 0;
  if (!left.length) return 1;
  if (!right.length) return -1;

  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index];
    const rightPart = right[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;

    const leftIsNumeric = /^\d+$/.test(leftPart);
    const rightIsNumeric = /^\d+$/.test(rightPart);
    if (leftIsNumeric && rightIsNumeric) {
      const comparison = compareNumericStrings(leftPart, rightPart);
      if (comparison) return comparison;
      continue;
    }
    if (leftIsNumeric) return -1;
    if (rightIsNumeric) return 1;
    return leftPart.localeCompare(rightPart, undefined, { sensitivity: "base" });
  }
  return 0;
}

function detectNamedChannel(tag) {
  const match = String(tag || "").match(
    /(?:^|[._+-])(alpha|beta|rc|pre(?:view)?)(?:[._+-]?\d*)?(?=$|[._+-])/i,
  ) || String(tag || "").match(
    /\d(alpha|beta|rc|pre(?:view)?)[._+-]?\d*(?=$|[._+-])/i,
  );
  if (!match) return null;
  const channel = match[1].toLowerCase();
  if (channel === "preview") return "pre";
  return channel;
}

export function parseVersionTag(tag) {
  const value = String(tag || "");
  const match = value.match(SEMVER_PATTERN);
  if (!match) return null;
  return {
    major: match[1],
    minor: match[2],
    patch: match[3],
    prerelease: match[4] ? match[4].toLowerCase().split(".") : [],
    build: match[5] ? match[5].toLowerCase().split(".") : [],
  };
}

export function compareVersionTags(leftTag, rightTag) {
  const left = parseVersionTag(leftTag);
  const right = parseVersionTag(rightTag);

  if (left && right) {
    for (const key of ["major", "minor", "patch"]) {
      const comparison = compareNumericStrings(left[key], right[key]);
      if (comparison) return comparison;
    }
    const prereleaseComparison = comparePrerelease(left.prerelease, right.prerelease);
    if (prereleaseComparison) return prereleaseComparison;
  } else if (left || right) {
    return left ? -1 : 1;
  }

  return NATURAL_COLLATOR.compare(String(leftTag || ""), String(rightTag || ""));
}

export function releaseChannel(release) {
  const namedChannel = detectNamedChannel(release?.tag_name);
  if (namedChannel) return namedChannel;

  const parsed = parseVersionTag(release?.tag_name);
  if (parsed?.prerelease.length || release?.prerelease) return "pre";
  return null;
}

export function releaseChannelLabel(channel) {
  return CHANNEL_LABELS[channel] || CHANNEL_LABELS.pre;
}
