'use strict'

const { targetOptions } = require('./getTargetInput')
const checkTargetMatchToPR = (prTitle, target= targetOptions.major) => {
  if(!prTitle || target ===  targetOptions.major) {
    return true
  }
  const titleSplitByFrom = prTitle.split('from')
  if (titleSplitByFrom.length === 2) {
    const versionsArray = titleSplitByFrom[1].split('to')
    if(versionsArray.length === 2) {
      const [fromVersion, toVersion] = versionsArray
      const fromVersionArray = fromVersion.trim().split('.')
      const toVersionArray = toVersion.trim().split('.')
      if(fromVersionArray.length === 3 && toVersionArray === 3){
        // TODO: we know know that we have version numbers so implement the logic

      }
    }
  }
  return true
}
module.exports = checkTargetMatchToPR
