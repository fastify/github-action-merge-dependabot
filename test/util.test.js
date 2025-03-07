'use strict'
const { test } = require('node:test')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const logWarningStub = sinon.stub()
const { getInputs, parseCommaOrSemicolonSeparatedValue } = proxyquire(
  '../src/util',
  {
    '../src/log.js': {
      logWarning: logWarningStub,
    },
  }
)

test('parseCommaOrSemicolonSeparatedValue', async t => {
  await t.test('should split semicolon separated values correctly', async t => {
    t.assert.deepStrictEqual(parseCommaOrSemicolonSeparatedValue('test1;test2;test3'), [
      'test1',
      'test2',
      'test3',
    ])
    t.assert.deepStrictEqual(parseCommaOrSemicolonSeparatedValue('  test1; test2; test3'), [
      'test1',
      'test2',
      'test3',
    ])
  })
  await t.test('should split comma separated values correctly', async t => {
    t.assert.deepStrictEqual(parseCommaOrSemicolonSeparatedValue('test1,test2,test3'), [
      'test1',
      'test2',
      'test3',
    ])
    t.assert.deepStrictEqual(parseCommaOrSemicolonSeparatedValue('  test1, test2, test3'), [
      'test1',
      'test2',
      'test3',
    ])
  })
})

const BOOLEAN_INPUTS = [
  { input: 'approve-only', key: 'APPROVE_ONLY' },
  { input: 'use-github-auto-merge', key: 'USE_GITHUB_AUTO_MERGE' },
  {
    input: 'skip-commit-verification',
    key: 'SKIP_COMMIT_VERIFICATION',
  },
  {
    input: 'skip-verification',
    key: 'SKIP_VERIFICATION',
  },
]

test('getInputs', async t => {
  await t.test('should fail if no inputs object is provided', async t => {
    t.assert.throws(() => getInputs())
  })
  await t.test(
    'should return the correct inputs with default value if needed',
    async t => {
      await t.test('MERGE_METHOD', async t => {
        t.assert.deepEqual(getInputs({}).MERGE_METHOD, 'squash')
        t.assert.deepEqual(getInputs({ 'merge-method': 'merge' }).MERGE_METHOD, 'merge')
        t.assert.deepEqual(logWarningStub.callCount, 0)
        t.assert.deepEqual(
          getInputs({ 'merge-method': 'invalid-merge-method' }).MERGE_METHOD,
          'squash'
        )
        t.assert.deepEqual(logWarningStub.callCount, 1)
        t.assert.deepEqual(
          logWarningStub.firstCall.args[0],
          'merge-method input is ignored because it is malformed, defaulting to `squash`.'
        )
      })
      await t.test('EXCLUDE_PKGS', async t => {
        t.assert.deepStrictEqual(getInputs({ exclude: 'react,vue' }).EXCLUDE_PKGS, [
          'react',
          'vue',
        ])
      })
      await t.test('MERGE_COMMENT', async t => {
        t.assert.deepEqual(getInputs({}).MERGE_COMMENT, '')
        t.assert.deepStrictEqual(
          getInputs({ 'merge-comment': 'test-merge-comment' }).MERGE_COMMENT,
          'test-merge-comment'
        )
      })
      await t.test('BOOLEAN INPUTS', async t => {
        BOOLEAN_INPUTS.forEach(({ input, key }) => {
          t.assert.deepEqual(getInputs({})[key], false)
          t.assert.deepEqual(getInputs({ [input]: 'false' })[key], false)
          t.assert.deepEqual(getInputs({ [input]: 'False' })[key], false)
          t.assert.deepEqual(getInputs({ [input]: 'FALSE' })[key], false)
          t.assert.deepEqual(getInputs({ [input]: 'true' })[key], true)
          t.assert.deepEqual(getInputs({ [input]: 'True' })[key], true)
          t.assert.deepEqual(getInputs({ [input]: 'TRUE' })[key], true)
        })
      })
      await t.test('TARGET', async t => {
        t.assert.deepEqual(
          getInputs({ target: 'major' }).TARGET,
          'version-update:semver-major'
        )
        t.assert.deepEqual(
          getInputs({ target: 'minor' }).TARGET,
          'version-update:semver-minor'
        )
        t.assert.deepEqual(
          getInputs({ target: 'patch' }).TARGET,
          'version-update:semver-patch'
        )
        t.assert.deepEqual(getInputs({ target: '' }).TARGET, 'version-update:semver-any')
        t.assert.deepEqual(
          getInputs({ target: 'any' }).TARGET,
          'version-update:semver-any'
        )
      })
      await t.test('PR_NUMBER', async t => {
        t.assert.deepEqual(getInputs({ 'pr-number': '10' }).PR_NUMBER, '10')
      })
    }
  )
})
