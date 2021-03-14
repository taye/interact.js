const fs = require('fs')
const path = require('path')

const glob = require('glob')
const semver = require('semver')

const getVersion = require('../getVersion')

let [, , cwd, versionChange, prereleaseId] = process.argv

if (cwd === undefined || !cwd.startsWith('/')) {
  ;[cwd, versionChange, prereleaseId] = [process.cwd(), cwd, versionChange]
}

const depFields = ['dependencies', 'peerDependencies', 'devDependencies', 'optionalDependencies']

let currentVersion

const previousVersion = getVersion(cwd)

if (versionChange) {
  if (/^(major|minor|patch|premajor|preminor|prepatch|prerelease)$/.test(versionChange)) {
    currentVersion = semver.inc(previousVersion, versionChange, prereleaseId)
  } else {
    currentVersion = semver.clean(versionChange)

    if (currentVersion === null) {
      throw Error(`Invalid version change "${previousVersion}" -> "${versionChange}"`)
    }
  }

  const versionTable = []

  for (const file of [
    'package.json',
    ...glob.sync('packages/{@interactjs/*,interactjs}/package.json', { cwd }),
  ]) {
    const pkg = require(path.resolve(file))

    versionTable.push({ package: pkg.name, old: pkg.version, new: currentVersion })

    pkg.version = currentVersion

    for (const deps of depFields.map((f) => pkg[f]).filter(Boolean)) {
      for (const name of Object.keys(deps).filter((n) => /@?interactjs\//.test(n))) {
        if (deps[name] === previousVersion) {
          deps[name] = currentVersion
        } else {
          console.warn(`${file}: not updating "${name}" from "${deps[name]}"`)
        }
      }
    }

    fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
  }

  console.table(versionTable)
}
// if this was run with no arguments, get the current version
else {
  currentVersion = previousVersion
  console.log(currentVersion)
}
