'use strict'
const { test } = require('node:test')

const { updateTypes, mapUpdateType } = require('../src/mapUpdateType')

test('mapUpdateType', async t => {
  t.test(
    'should return the updateType or any if invalid or missing',
    async t => {
      t.assert.deepEqual(mapUpdateType('major'), updateTypes.major)
      t.assert.deepEqual(mapUpdateType('minor'), updateTypes.minor)
      t.assert.deepEqual(mapUpdateType('patch'), updateTypes.patch)
      t.assert.deepEqual(mapUpdateType('bad_input'), updateTypes.any)
      t.assert.deepEqual(mapUpdateType(), updateTypes.any)
      t.assert.deepEqual(mapUpdateType('any'), updateTypes.any)
    }
  )
})
