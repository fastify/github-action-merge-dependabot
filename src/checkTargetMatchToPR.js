'use strict'
const semverDiff = require('semver/functions/diff')

const { semanticVersionOrder } = require('./getTargetInput')

const expression = /from ([^\s]+) to (.+)$/

const checkTargetMatchToPR = (prTitle, target) => {
  const match = expression.exec(prTitle)

  if (!match) {
    return true
  }
  const diff = semverDiff(match[1], match[2])

  return !(
    diff &&
    semanticVersionOrder.indexOf(diff) > semanticVersionOrder.indexOf(target)
  )
}
module.exports = checkTargetMatchToPR
