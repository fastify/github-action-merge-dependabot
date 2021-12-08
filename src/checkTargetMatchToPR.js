'use strict'
const semverDiff = require('semver/functions/diff')
const semverCoerce = require('semver/functions/coerce')

const { semanticVersionOrder } = require('./getTargetInput')

const expression = /from ([^\s]+) to ([^\s]+)/

const checkTargetMatchToPR = (prTitle, target) => {
  const match = expression.exec(prTitle)

  if (!match) {
    return true
  }

  const [, from, to] = match

  const isNotSemantic = isAlpha(from) 
  
  || isAlpha(to)


  const diff = semverDiff(semverCoerce(from), semverCoerce(to))

  return !(
    diff &&
    semanticVersionOrder.indexOf(diff) > semanticVersionOrder.indexOf(target)
  )
}

function isAlpha(version) {
  return /[A-Z]+/i.test(version)
}

module.exports = checkTargetMatchToPR
