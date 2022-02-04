'use strict'
const tap = require('tap')

const { targetOptions, getTargetInput } = require('../src/getTargetInput')

tap.test('getTargetInput', async t => {
  t.test('should return major when major provided', async t => {
    t.equal(getTargetInput(targetOptions.major), targetOptions.major)
  })
  t.test('should return minor when minor provided', async t => {
    t.equal(getTargetInput(targetOptions.minor), targetOptions.minor)
  })
  t.test('should return patch when patch provided', async t => {
    t.equal(getTargetInput(targetOptions.patch), targetOptions.patch)
  })
  t.test('should return any when input is not recognized', async t => {
    t.equal(getTargetInput('bad_input'), targetOptions.any)
  })
  t.test('should return any when any provided', async t => {
    t.equal(getTargetInput(targetOptions.any), targetOptions.any)
  })
})
