'use strict'
const semverDiff = require('semver/functions/diff')
const { logInfo } = require('./log')

const { semanticVersionOrder } = require('./getTargetInput')

const expression = /from ([^\s]+) to ([^\s]+)/

const checkTargetMatchToPR = (prTitle, target) => {
  logInfo({prTitle})
  logInfo({target})
  const match = expression.exec(prTitle)
  logInfo(match)

  if (!match) {
    return true
  }
  const diff = semverDiff(match[1], match[2])
  logInfo(diff)

  return !(
    diff &&
    semanticVersionOrder.indexOf(diff) > semanticVersionOrder.indexOf(target)
  )
}
module.exports = checkTargetMatchToPR
