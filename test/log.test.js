'use strict'

const tap = require('tap')
const sinon = require('sinon')

const coreStubs = {
  debug: sinon.stub(),
  error: sinon.stub(),
  info: sinon.stub(),
  warning: sinon.stub(),
}
const log = tap.mock('../src/log', {
  '@actions/core': coreStubs
})

tap.afterEach(() => {
  sinon.resetHistory()
})

tap.test('logError should work with numbers', async () => {
  log.logError(100)
  sinon.assert.calledWith(coreStubs.error, '100')
})

tap.test('logError should work with strings', async () => {
  log.logError('100')
  sinon.assert.calledWith(coreStubs.error, '100')
})

tap.test('log should call aproppriate core function', async () => {
  const msg = 'log message'
  log.logError(msg)
  sinon.assert.calledWith(coreStubs.error, msg)
  log.logWarning(msg)
  sinon.assert.calledWith(coreStubs.warning, msg)
  log.logInfo(msg)
  sinon.assert.calledWith(coreStubs.info, msg)
  log.logDebug(msg)
  sinon.assert.calledWith(coreStubs.debug, msg)
})
