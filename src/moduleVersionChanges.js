'use strict'

const semverDiff = require('semver/functions/diff')
const semverCoerce = require('semver/functions/coerce')
const { parse } = require('gitdiff-parser')
const { isCommitHash, isValidSemver } = require('./util')

const { semanticVersionOrder } = require('./getTargetInput')

const expression = /"([^\s]+)":\s*"([^\s]+)"/

const checkModuleVersionChanges = (moduleChanges, target) => {
  for (const module in moduleChanges) {
    const from = moduleChanges[module].delete
    const to = moduleChanges[module].insert

    if (!from || !to) {
      return false
    }

    if (isCommitHash(from) && isCommitHash(to)) {
      return true
    }

    if (!isValidSemver(from) || !isValidSemver(to)) {
      throw new Error(`Module "${module}" contains invalid semver versions from: ${from} to: ${to}`)
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
