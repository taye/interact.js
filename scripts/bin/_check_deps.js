const fs = require('fs/promises')

const { getPackageJsons, errorExit } = require('../utils')

async function checkDeps () {
  const packageJsons = await getPackageJsons()
  const pkgNames = new Set(packageJsons.map(([, pkg]) => pkg.name))

  Promise.all(
    packageJsons.map(async ([p, pkg]) => {
      for (const depField of ['dependencies', 'peerDependencies', 'devDependencies']) {
        const missingDeps = Object.keys(pkg[depField] || {}).filter(
          (depName) => depName.startsWith('@interactjs/') && !pkgNames.has(depName),
        )

        for (const depName of missingDeps) {
          delete pkg[depField][depName]
          console.warn(`tidying ${pkg.name} ${depField} ✕ ${depName}`)
        }
      }

      await fs.writeFile(p, JSON.stringify(pkg, null, 2) + '\n')
    }),
  )
}

checkDeps().catch(errorExit)
