'use strict'
const { test } = require('node:test')

const { updateTypes, mapUpdateType } = require('../src/mapUpdateType')

test('mapUpdateType', async t => {
  t.test(
    'should return the updateType or any if invalid or missing',
    async t => {
      t.assert.deepStrictEqual(mapUpdateType('major'), updateTypes.major)
      t.assert.deepStrictEqual(mapUpdateType('minor'), updateTypes.minor)
      t.assert.deepStrictEqual(mapUpdateType('patch'), updateTypes.patch)
      t.assert.deepStrictEqual(mapUpdateType('bad_input'), updateTypes.any)
      t.assert.deepStrictEqual(mapUpdateType(), updateTypes.any)
      t.assert.deepStrictEqual(mapUpdateType('any'), updateTypes.any)
    }
  )
})
