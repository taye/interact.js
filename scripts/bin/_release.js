#!/usr/bin/env node
const fs = require('fs').promises
const path = require('path')

const shell = require('shelljs')

const { getPackages, isPro } = require('../utils')

const cwd = process.cwd()

process.env.PATH = `${cwd}/bin:${cwd}/node_modules/.bin:${process.env.PATH}`

shell.config.verbose = true
shell.config.fatal = true

ensureCleanIndex()

const { gitTag } = checkVersion()
let packages

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

async function main (ps) {
  gitDetatch()

  clean()

  packages = await getPackages()

  await runBuild()

  commitAndTag()
  pushAndPublish()
}

function ensureCleanIndex () {
  // make sure the repo is clean
  try {
    shell.exec('git diff-index -G . HEAD --stat --exit-code')
  } catch {
    throw new Error('working directory must be clean')
  }
}

function checkVersion () {
  const getVersion = require('../getVersion')
  const version = require('semver').clean(getVersion())

  if (!version) {
    throw new Error('failed to parse version')
  }

  return {
    version,
    gitTag: 'v' + version,
  }
}

function gitDetatch () {
  shell.exec('git checkout --detach')
}

function clean () {
  shell.exec('_clean')
}

async function runBuild () {
  // copy README to interactjs package
  await Promise.all((packages)
    .filter((p) => p.endsWith('interactjs'))
    .map((p) => fs.copyFile(`${cwd}/README.md`, `${p}/README.md`)))

  // copy license file and npmignore to all packages
  await Promise.all((packages).map(async (pkg) => {
    await fs.copyFile('LICENSE.md', path.join(pkg, isPro() ? 'LICENSE.md' : 'LICENSE'))
    await fs.copyFile('.npmignore', path.join(pkg, '.npmignore'))
  }))

  if (isPro) await fs.rm(path.resolve('LICENSE'))

  // create @interactjs/**/use/* modules
  shell.exec('_add_plugin_indexes')

  // generate esnext .js modules
  shell.exec('_esnext')

  // bundle interactjs, generate docs, transpile modules, generate declaration files
  shell.exec('npm run build')

  // set publishConfig
  await editPackageJsons((pkg) => {
    pkg.publishConfig = isPro()
      ? { access: 'restricted', registry: 'https://registry.interactjs.io' }
      : { access: 'public' }
  })
}

function commitAndTag () {
  // commit and add new version tag
  shell.exec('git add --all .')
  shell.exec('git add --force packages')
  shell.exec('git reset **/node_modules')
  shell.exec(`git commit --no-verify -m ${gitTag}`)
  shell.exec(`git tag ${gitTag}`)
}

async function pushAndPublish () {
  const { NPM_TAG } = process.env

  try {
    shell.exec(`git push --no-verify origin ${gitTag}`)
  } catch {
    throw new Error(`failed to push git tag ${gitTag} to origin`)
  }

  const gitHead = shell.exec('git rev-parse --short HEAD').trim()
  editPackageJsons((pkg) => { pkg.gitHead = gitHead })

  const npmPublishCommand = 'npm publish' + (NPM_TAG ? ` --tag ${NPM_TAG}` : '')

  for (const pkg of packages) {
    shell.exec(npmPublishCommand, { cwd: path.resolve(pkg) })
  }

  shell.exec('git checkout $(git ls-files "**package.json")')
}

async function editPackageJsons (func) {
  await (['.', ...packages]).map(async (packageDir) => {
    const file = path.resolve(packageDir, 'package.json')
    const pkg = JSON.parse((await fs.readFile(file)).toString())

    func(pkg)

    await fs.writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`)
  })
}
