'use strict'

const log = require('../src/log')
const tap = require('tap')
const sinon = require('sinon')

const stub = sinon.stub(log, 'logError').callThrough();

tap.afterEach(() => stub.resetHistory())

tap.test('logError should work with numbers', async () => {
  log.logError(100)
  sinon.assert.calledWith(log.logError, 100)
})

tap.test('logError should work with strings', async () => {
  log.logError('100')
  sinon.assert.calledWith(log.logError, '100')
})
