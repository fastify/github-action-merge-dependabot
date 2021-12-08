'use strict'
const semverDiff = require('semver/functions/diff')
const semverCoerce = require('semver/functions/coerce')
const semverValid = require('semver/functions/valid')

const { semanticVersionOrder } = require('./getTargetInput')
const { logWarning } = require('./log')

const expression = /from ([^\s]+) to ([^\s]+)/

const checkTargetMatchToPR = (prTitle, target) => {
  const match = expression.exec(prTitle)

  if (!match) {
    return true
  }

  const [, from, to] = match

  if ((!semverValid(from) && hasBadChars(from)) || (!semverValid(to) && hasBadChars(to))) {
    logWarning(`PR title contains invalid semver versions from: ${from} to: ${to}`)
    return false
  }

  const diff = semverDiff(semverCoerce(from), semverCoerce(to))

  return !(
    diff &&
    semanticVersionOrder.indexOf(diff) > semanticVersionOrder.indexOf(target)
  )
}

function hasBadChars(version) {
  // recognize submodules title likes 'Bump dotbot from `aa93350` to `acaaaac`'
  return /`/.test(version)
}

module.exports = checkTargetMatchToPR
