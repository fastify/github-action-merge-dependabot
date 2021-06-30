'use strict'
const tap = require('tap')
const { getTargetInput } = require('../src/lib/getTargetInput')

tap.test('getTargetInput', t => {
  t.equal(getTargetInput(),'major','should return major when nothing is provided')
  t.equal(getTargetInput(null),'major','should return major when input is null')
  t.equal(getTargetInput(''),'major','should return major when empty input provided')
  t.equal(getTargetInput('bad_input'),'major','should return major when input is not recognized')
  t.equal(getTargetInput('minor'),'minor','should return minor when input is minor')
  t.equal(getTargetInput('patch'),'patch','should return patch when input is patch')
  t.end()
})
