'use strict'

const targetOptions = {
  major: 'major',
  premajor: 'premajor',
  minor: 'minor',
  preminor: 'preminor',
  patch: 'patch',
  prepatch: 'prepatch',
  prerelease: 'prerelease',
  any: 'any'
}

const semanticVersionOrder = [
  targetOptions.prerelease,
  targetOptions.prepatch,
  targetOptions.patch,
  targetOptions.preminor,
  targetOptions.minor,
  targetOptions.premajor,
  targetOptions.major,
  targetOptions.any
]

const getTargetInput = input => {
  return targetOptions[input] || targetOptions.any
}

module.exports = { getTargetInput, targetOptions, semanticVersionOrder }
