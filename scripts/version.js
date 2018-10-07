const child_process = require('child_process');
const fs            = require('fs');
const semver        = require('semver');
const gitRev        = require('./gitRev');

const version = {
  get ({ updateMetadata = true } = {}) {
    const pkg = JSON.parse(fs.readFileSync('package.json').toString());

    const parsed = semver.parse(pkg.version);
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
    const pkgFile = 'package.json';

    const pkg = JSON.parse(fs.readFileSync(pkgFile).toString());
    pkg.version = newVersion;

    for (const deps of ['dependencies', 'peerDependencies', 'devDependencies'].map(f => pkg[f] || {})) {
      for (const name of Object.keys(deps).filter(n => /@?interactjs\//.test(n))) {
        deps[name] = newVersion;
      }
    }

    fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
  },
};

module.exports = version;
