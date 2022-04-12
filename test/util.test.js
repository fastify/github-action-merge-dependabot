'use strict'
const tap = require('tap')

tap.test('MERGE_METHOD should be squash for invalid input', async t => {
  const { getInputs } = t.mock('../src/util', {
    '@actions/core': {
      'getInput': () => '',
      debug: msg => msg,
      error: msg => msg,
      info: msg => msg,
      warning: msg => msg,
    }
  })
  t.equal(getInputs().MERGE_METHOD, 'squash')
})

tap.test('MERGE_METHOD should be correct for valid input', async t => {
  const { getInputs } = tap.mock('../src/util', {
    '@actions/core': {
      'getInput': () => 'merge',
      debug: msg => msg,
      error: msg => msg,
      info: msg => msg,
      warning: msg => msg,
    }
  })
  t.equal(getInputs().MERGE_METHOD, 'merge')
})
