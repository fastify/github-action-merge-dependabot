'use strict'
const tap = require('tap')

const { targetOptions, getTargetInput } = require('../src/getTargetInput')

tap.test('getTargetInput', async t => {
  t.test('should return major', async t => {
    t.test('when major provided', async t => {
      t.equal(getTargetInput(targetOptions.major), targetOptions.major)
    })
    t.test('when input is not recognized', async t => {
      t.equal(getTargetInput('bad_input'), targetOptions.major)
    })
  })
  t.test('should return minor when minor provided', async t => {
    t.equal(getTargetInput(targetOptions.minor), targetOptions.minor)
  })
  t.test('should return patch when patch provided', async t => {
    t.equal(getTargetInput(targetOptions.patch), targetOptions.patch)
  })
})
