#!/usr/bin/env node
const version = require('./version');

const [,, release, prereleaseId] = process.argv;

let newVersion;

if (release) {
  if (/^(major|minor|patch|premajor|preminor|prepatch|prerelease)$/.test(release)) {
    newVersion = version.bump({
      release,
      prereleaseId,
    });
  }
  else {
    newVersion = require('semver').clean(release);

    if (newVersion === null) {
      throw `Invalid version "${release}"`;
    }

    const metadata = release.replace(/^[^+]*[+]*/, '');

    if (metadata) {
      newVersion = `${newVersion}+${metadata}`;
    }
  }
}
// if this was run with no arguments, get the current version with
// updated build metadata
else {
  newVersion = version.get();
}

version.write(newVersion);
console.log(newVersion);
