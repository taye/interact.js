const fs = require('fs').promises
const path = require('path')

const shell = require('shelljs')

const { getPackages, isPro, registryUrl, errorExit } = require('../utils')

const cwd = process.cwd()

process.env.PATH = `${cwd}/bin:${cwd}/node_modules/.bin:${process.env.PATH}`

shell.config.verbose = true
shell.config.fatal = true

ensureCleanIndex()

const { gitTag } = checkVersion()
let packages

main().catch(errorExit)

async function main (ps) {
  gitDetatch()

  clean()

  packages = await getPackages()

  await runBuild()

  await commit()
  await pushAndPublish()
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
  await Promise.all(
    packages
      .filter((p) => p.endsWith('interactjs'))
      .map((p) => fs.copyFile(`${cwd}/README.md`, `${p}/README.md`)),
  )

  // copy license file and npmignore to all packages
  const licenseFilename = isPro ? 'LICENSE.md' : 'LICENSE'
  await Promise.all(
    packages.map(async (pkg) => {
      await fs.copyFile(licenseFilename, path.join(pkg, licenseFilename))
      await fs.copyFile('.npmignore', path.join(pkg, '.npmignore'))
    }),
  )

  if (isPro) await fs.rm(path.resolve('LICENSE'))

  // clean up scope deps
  shell.exec('npx _check_deps')

  if (!isPro) {
    // bundle interactjs
    shell.exec('npm run bundle')

    // generate docs
    shell.exec('npm run docs')
  }

  // create @interactjs/**/use/* modules
  shell.exec('npx _add_plugin_indexes')

  // generate types
  shell.exec('npx _types')

  // generate esnext .js modules
  shell.exec('npx _esnext')

  // set publishConfig
  await editPackageJsons((pkg) => {
    pkg.publishConfig = isPro ? { access: 'restricted', registry: registryUrl } : { access: 'public' }
  })
}

function commit () {
  // commit and add new version tag
  shell.exec('git add --all .')
  shell.exec('git add --force packages')
  shell.exec('git reset **/node_modules')
  shell.exec(`git commit --no-verify -m ${gitTag}`)
}

async function pushAndPublish () {
  const { NPM_TAG } = process.env

  try {
    shell.exec(`git push --no-verify origin HEAD:refs/tags/${gitTag}`)
  } catch {
    throw new Error(`failed to push git tag ${gitTag} to origin`)
  }

  const gitHead = shell.exec('git rev-parse --short HEAD').trim()
  await editPackageJsons((pkg) => {
    pkg.gitHead = gitHead
  })

  const npmPublishCommand = 'npm publish' + (NPM_TAG ? ` --tag ${NPM_TAG}` : '')
  const packagesToPublish = isPro ? packages.filter((p) => /@interactjs\//.test(p)) : packages

  for (const pkg of packagesToPublish) {
    shell.exec(npmPublishCommand, { cwd: path.resolve(pkg) })
  }

  shell.exec('git checkout $(git ls-files "**package.json")')
}

async function editPackageJsons (func) {
  await ['.', ...packages].map(async (packageDir) => {
    const file = path.resolve(packageDir, 'package.json')
    const pkg = JSON.parse((await fs.readFile(file)).toString())

    func(pkg)

    await fs.writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`)
  })
}
