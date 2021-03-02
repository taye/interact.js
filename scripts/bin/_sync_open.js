#!/usr/bin/env node
const fs = require('fs/promises')
const path = require('path')
const util = require('util')

const glob = util.promisify(require('glob'))
const shell = require('shelljs')

const { getPackages } = require('../utils')

shell.config.verbose = true
shell.config.fatal = true

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main () {
  shell.exec('git remote add github git@github.com:taye/interact.js | true')
  shell.exec('git fetch github')
  shell.exec('git fetch origin tag github-sync')
  shell.exec('git checkout github/main')

  const commits = shell
    .exec('git rev-list --topo-order refs/tags/github-sync..origin/main')
    .stdout.trim()
    .split('\n')
    .reverse()

  if (!commits.length) {
    console.info('no commits to apply')
    return
  }

  let applied = 0

  for (const hash of commits) {
    applied += (await applyCommit(hash)) ? 1 : 0
  }

  if (!applied) {
    console.info('all commits were empty')
    return
  }

  // ensure types are valid
  shell.exec('npx tsc -b')

  shell.exec(`git log --graph --oneline --decorate -${applied + 2}`)

  // push to github
  shell.exec('git push --no-verify github HEAD:main')

  // update sync marker tag
  shell.exec('git push -f --no-verify git@gitlab.com:interactjs/library origin/main:refs/tags/github-sync')
}

async function applyCommit (hash) {
  console.info('\n========================================')
  shell.exec(`git log --oneline -1 ${hash}`)
  console.log()

  try {
    shell.exec(`git cherry-pick ${hash}`)
  } catch (error) {
    console.warn('cleaning up conflicts')
    await cleanup()

    try {
      // skip commit if empty after cleaning up conflicts
      shell.exec('git diff-index -G . HEAD --stat --exit-code')
      shell.exec('git cherry-pick --abort')
      console.info('empty commit')
      return false
    } catch {
      shell.exec('git commit --no-edit')
    }
  }

  await cleanup()

  // amend commit if changed after cleaning up
  shell.exec('git diff-index -G . HEAD --stat --exit-code || git commit --all --amend --no-edit --no-verify')
  return true
}

async function cleanup () {
  await applyStubs()
  await removeProPackages()
  await removeExcludedFiles()
  await setMitLicense()
}

async function removeProPackages () {
  const packageJsons = await getPackageJsons()

  const proPackages = packageJsons
    .filter(([_p, pkg]) => pkg.publishConfig?.access === 'restricted')
    .map(([p]) => path.dirname(p))

  await removeFiles(proPackages)
}

async function applyStubs () {
  const stubs = await glob('packages/**/*.stub.ts')
  const originalsWithSpecs = stubs.flatMap((stub) => ['.ts', '.spec.ts'].map((ext) => getStubOriginal(stub, ext)))

  await removeFiles(originalsWithSpecs)

  // copy stubs to original filename
  await Promise.all(stubs.map((stub) => fs.copyFile(stub, getStubOriginal(stub))))
  shell.exec(`git add -f ${stubs.map((stub) => getStubOriginal(stub)).join(' ')}`, { silent: true })
}

async function removeExcludedFiles () {
  await removeFiles([
    '.gitlab-ci.yml',
    'bin/_sync_open',
    'scripts/shims.js',
    'tests/iframes',
    'LICENSE.md',
  ])
}

async function setMitLicense () {
  const packageJsons = await getPackageJsons()

  await Promise.all(
    packageJsons
      .filter(([_p, pkg]) => pkg.publishConfig?.access !== 'restricted')
      .map(async ([jsonPath, pkg]) => {
        pkg.license = 'MIT'
        await fs.writeFile(jsonPath, JSON.stringify(pkg, null, 2) + '\n')
      }),
  )
}

async function getPackageJsons (files) {
  return Promise.all((await getPackages()).map(async (p) => {
    const jsonPath = path.resolve(p, 'package.json')
    const pkg = JSON.parse((await fs.readFile(jsonPath)).toString())
    return [jsonPath, pkg]
  }))
}

function getStubOriginal (stub, ext = '.ts') {
  return stub.replace(/\.stub\.ts$/, ext)
}

async function removeFiles (files) {
  files = files
    .filter(Boolean)
    .map((file) => path.resolve(file))

  if (!files.length) return

  const existingFiles = await glob(`{${files.join(',')}}`)

  if (!existingFiles.length) return

  const gitFilesArg = existingFiles.join(' ')

  // add files to git then delete them to ensure even unresolved files are deleted
  shell.exec(`git add ${gitFilesArg}`, { silent: true })
  shell.exec(`git rm -rf ${gitFilesArg}`, { silent: true })
}
