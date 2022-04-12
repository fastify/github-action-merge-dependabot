'use strict'

const semverDiff = require('semver/functions/diff')
const semverCoerce = require('semver/functions/coerce')
const semverValid = require('semver/functions/valid')
const { parse } = require('gitdiff-parser')

const { semanticVersionOrder } = require('./getTargetInput')
const { logWarning } = require('./log')

const expression = /"([^\s]+)":\s*"([^\s]+)"/

function hasBadChars(version) {
  // recognize submodules title likes 'Bump dotbot from `aa93350` to `acaaaac`'
  return /^[^^~*-0-9+x]/.test(version)
}

const checkModuleVersionChanges = (moduleChanges, target) => {
  for (const module in moduleChanges) {
    const from = moduleChanges[module].delete
    const to = moduleChanges[module].insert

    if (!from || !to) {
      return false
    }

    if ((!semverValid(from) && hasBadChars(from)) || (!semverValid(to) && hasBadChars(to))) {
      logWarning(`Module "${module}" contains invalid semver versions from: ${from} to: ${to}`)
      return false
    }

    const diff = semverDiff(semverCoerce(from), semverCoerce(to))
    const isDiffBeyondTarget =
      semanticVersionOrder.indexOf(diff) > semanticVersionOrder.indexOf(target)

    if (diff && isDiffBeyondTarget) {
      return false
    }
  }

  return true
}

const getModuleVersionChanges = (prDiff) => {
  const parsedDiffFiles = parse(prDiff)
  const packageJsonChanges = parsedDiffFiles.find((file) => file.newPath === 'package.json')
  if (!packageJsonChanges) {
    return false
  }

  const moduleChanges = {}
  for (const idx in packageJsonChanges.hunks) {
    const changes = packageJsonChanges.hunks[idx].changes.filter(
      (c) => c.type === 'delete' || c.type === 'insert'
    )

    for (const changeIdx in changes) {
      const change = changes[changeIdx]

      const match = expression.exec(change.content)
      if (!match) {
        continue
      }

      const [, module, version] = match
      if (module in moduleChanges) {
        moduleChanges[module][change.type] = version
      } else {
        moduleChanges[module] = { [change.type]: version }
      }
    }
  }

  return moduleChanges
}

module.exports = {
  getModuleVersionChanges,
  checkModuleVersionChanges,
}
