'use strict'

const { test, afterEach } = require('node:test')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const coreStubs = {
  debug: sinon.stub(),
  error: sinon.stub(),
  info: sinon.stub(),
  warning: sinon.stub(),
}

const log = proxyquire('../src/log', {
  '@actions/core': coreStubs,
})

afterEach(() => {
  sinon.resetHistory()
})

test('logError should work with numbers', async () => {
  log.logError(100)
  sinon.assert.calledWith(coreStubs.error, '100')
})

test('logError should work with strings', async () => {
  log.logError('100')
  sinon.assert.calledWith(coreStubs.error, '100')
})

test('log should call aproppriate core function', async () => {
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
