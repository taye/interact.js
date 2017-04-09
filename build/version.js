const child_process = require('child_process');
const fs            = require('fs');
const semver        = require('semver');
const gitRev        = require('./gitRev');

const version = {
  get ({ updateMetadata = true } = {}) {
    const package = JSON.parse(fs.readFileSync('package.json').toString());

    const parsed = semver.parse(package.version);
    const dirty = child_process.execSync(`
      git diff-index --quiet HEAD -- . ':!dist' ':!package.json' &&
      git diff --quiet -- . ':!dist' ||
      echo -dirty`).toString().trim();
    const matchedMetadata = parsed.raw.match(/[+].*$/);
    const newMetadata = updateMetadata
      ? `+sha.${gitRev.short()}`.trim()
      : matchedMetadata? matchedMetadata[0] : '';

    return `v${parsed.version}${newMetadata}${dirty}`;
  },

  bump ({
    version: prev = version.get(),
    release = 'minor',
    prereleaseId,
  }) {
    const semverArgs = [prev, release, prereleaseId];

    let newVersion = semver.inc(...semverArgs);

    if (newVersion === null) {
      throw `Invalid args to semver.inc (${semverArgs.join()})`;
    }

    if (release === 'prerelease') {
      newVersion += `+sha.${gitRev.short()}`;
    }

    return newVersion;
  },

  write (newVersion) {
    const package = JSON.parse(fs.readFileSync('package.json').toString());
    package.version = newVersion;

    fs.writeFileSync('package.json', `${JSON.stringify(package, null, 2)}\n`);
  },
};

module.exports = version;
