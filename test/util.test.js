'use strict'
const tap = require('tap')
const {
  getInputs,
  parseCommaOrSemicolonSeparatedValue,
} = require('../src/util')

tap.test('parseCommaOrSemicolonSeparatedValue', async t => {
  t.test('should split semicolon separated values correctly', async t => {
    t.same(parseCommaOrSemicolonSeparatedValue('test1;test2;test3'), [
      'test1',
      'test2',
      'test3',
    ])
    t.same(parseCommaOrSemicolonSeparatedValue('  test1; test2; test3'), [
      'test1',
      'test2',
      'test3',
    ])
  })
  t.test('should split comma separated values correctly', async t => {
    t.same(parseCommaOrSemicolonSeparatedValue('test1,test2,test3'), [
      'test1',
      'test2',
      'test3',
    ])
    t.same(parseCommaOrSemicolonSeparatedValue('  test1, test2, test3'), [
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
]

tap.test('getInputs', async t => {
  t.test('should fail if no inputs object is provided', async t => {
    t.throws(() => getInputs())
  })
  t.test(
    'should return the correct inputs with default value if needed',
    async t => {
      t.test('MERGE_METHOD', async t => {
        t.equal(getInputs({}).MERGE_METHOD, 'squash')
        t.equal(getInputs({ 'merge-method': 'merge' }).MERGE_METHOD, 'merge')
        t.equal(
          getInputs({ 'merge-method': 'invalid-merge-method' }).MERGE_METHOD,
          'squash'
        )
      })
      t.test('EXCLUDE_PKGS', async t => {
        t.same(getInputs({ exclude: 'react,vue' }).EXCLUDE_PKGS, [
          'react',
          'vue',
        ])
      })
      t.test('MERGE_COMMENT', async t => {
        t.equal(getInputs({}).MERGE_COMMENT, '')
        t.equal(
          getInputs({ 'merge-comment': 'test-merge-comment' }).MERGE_COMMENT,
          'test-merge-comment'
        )
      })
      t.test('BOOLEAN INPUTS', async t => {
        BOOLEAN_INPUTS.forEach(({ input, key }) => {
          t.equal(getInputs({})[key], false)
          t.equal(getInputs({ [input]: 'false' })[key], false)
          t.equal(getInputs({ [input]: 'False' })[key], false)
          t.equal(getInputs({ [input]: 'FALSE' })[key], false)
          t.equal(getInputs({ [input]: 'true' })[key], true)
          t.equal(getInputs({ [input]: 'True' })[key], true)
          t.equal(getInputs({ [input]: 'TRUE' })[key], true)
        })
      })
      t.test('TARGET', async t => {
        t.equal(
          getInputs({ target: 'major' }).TARGET,
          'version-update:semver-major'
        )
        t.equal(
          getInputs({ target: 'minor' }).TARGET,
          'version-update:semver-minor'
        )
        t.equal(
          getInputs({ target: 'patch' }).TARGET,
          'version-update:semver-patch'
        )
        t.equal(getInputs({ target: '' }).TARGET, 'version-update:semver-any')
        t.equal(
          getInputs({ target: 'any' }).TARGET,
          'version-update:semver-any'
        )
      })
      t.test('PR_NUMBER', async t => {
        t.equal(getInputs({ 'pr-number': '10' }).PR_NUMBER, '10')
      })
    }
  )
})
