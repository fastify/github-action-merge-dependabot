import { debug, error, info, warning } from '@actions/core'

const stringify = msg =>
  typeof msg === 'string' ? msg : msg.stack || msg.toString()

const log = logger => message => logger(stringify(message))

export const logDebug = log(debug)
export const logError = log(error)
export const logInfo = log(info)
export const logWarning = log(warning)
