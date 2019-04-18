#!/usr/bin/env node
const path = require('path')

let newVersion

module.exports.get = () => {
  const rootPkg = require(path.resolve('package.json'))

  return rootPkg.version
}

if (!module.parent) {
  const semver = require('semver')
  const fs = require('fs')
  const glob = require('glob')

  const [,, versionChange, prereleaseId] = process.argv
  const oldVersion = module.exports.get()

  if (versionChange) {
    if (/^(major|minor|patch|premajor|preminor|prepatch|prerelease)$/.test(versionChange)) {
      newVersion = semver.inc(oldVersion, versionChange, prereleaseId)
    }
    else {
      newVersion = semver.clean(versionChange)

      if (newVersion === null) {
        throw Error(`Invalid version change "${oldVersion}" -> "${versionChange}"`)
      }
    }

    const versionTable = []

    for (const file of ['package.json', ...glob.sync('packages/*/package.json')]) {
      const pkg = require(path.resolve(file))

      versionTable.push({ package: pkg.name, old: pkg.version, new: newVersion })

      pkg.version = newVersion

      for (const deps of ['dependencies', 'peerDependencies', 'devDependencies'].map(f => pkg[f]).filter(Boolean)) {
        for (const name of Object.keys(deps).filter(n => /@?interactjs\//.test(n))) {
          if (deps[name] === oldVersion) {
            deps[name] = newVersion
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
    newVersion = oldVersion
  }

  console.log(newVersion)
}
