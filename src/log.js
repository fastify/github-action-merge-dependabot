'use strict'

const { debug, error, info, warning } = require('@actions/core')

const stringify = (msg) =>
  typeof msg === 'string' ? msg : msg.stack || msg.toString()

const log = (logger) => (message) => logger(stringify(message))

exports.logDebug = log(debug)
exports.logError = log(error)
exports.logInfo = log(info)
exports.logWarning = log(warning)
