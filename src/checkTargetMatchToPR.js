'use strict'
const semverDiff = require('semver/functions/diff')
const core = require('@actions/core')

const { semanticVersionOrder } = require('./getTargetInput')

const expression = /from ([^\s]+) to ([^\s]+)/

const checkTargetMatchToPR = (prTitle, target) => {
  core.info({prTitle})
  core.info({target})
  const match = expression.exec(prTitle)
  core.info(match)

  if (!match) {
    return true
  }
  const diff = semverDiff(match[1], match[2])
  core.info(diff)

  return !(
    diff &&
    semanticVersionOrder.indexOf(diff) > semanticVersionOrder.indexOf(target)
  )
}
module.exports = checkTargetMatchToPR
