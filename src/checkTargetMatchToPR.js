'use strict'
const semverDiff = require('semver/functions/diff')

const { semanticVersionOrder } = require('./getTargetInput')

const expression = /from ([^\s]+) to ([^\s]+)/

const checkTargetMatchToPR = (prTitle, target) => {
  console.log({prTitle})
  console.log({target})
  const match = expression.exec(prTitle)
  console.log({match})

  if (!match) {
    return true
  }
  const diff = semverDiff(match[1], match[2])
  console.log({diff})

  return !(
    diff &&
    semanticVersionOrder.indexOf(diff) > semanticVersionOrder.indexOf(target)
  )
}
module.exports = checkTargetMatchToPR
