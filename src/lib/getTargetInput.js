'use strict'

const targetOptions = {
  major: 'major',
  minor: 'minor',
  patch: 'patch',
}

const getTargetInput = (input) => {
  if(input && targetOptions[input]) {
    return targetOptions[input]
  }
  return targetOptions.major
}

module.exports = {getTargetInput,targetOptions}
