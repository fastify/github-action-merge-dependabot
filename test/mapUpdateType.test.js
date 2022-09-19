'use strict'
const tap = require('tap')

const { updateTypes, mapUpdateType } = require('../src/mapUpdateType')

tap.test('mapUpdateType', async t => {
  t.test(
    'should return the updateType or any if invalid or missing',
    async t => {
      t.equal(mapUpdateType('major'), updateTypes.major)
      t.equal(mapUpdateType('minor'), updateTypes.minor)
      t.equal(mapUpdateType('patch'), updateTypes.patch)
      t.equal(mapUpdateType('bad_input'), updateTypes.any)
      t.equal(mapUpdateType(), updateTypes.any)
      t.equal(mapUpdateType('any'), updateTypes.any)
    }
  )
})
