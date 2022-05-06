'use strict'
const tap = require('tap')
const { isValidSemver, isCommitHash, getPackageName } = require('../src/util')

const coreStubs = {
  'getInput': () => '',
  debug: msg => msg,
  error: msg => msg,
  info: msg => msg,
  warning: msg => msg,
}

tap.test('MERGE_METHOD should be squash for invalid input', async t => {
  const { getInputs } = t.mock('../src/util', {
    '@actions/core': {
      ...coreStubs
    }
  })
  t.equal(getInputs().MERGE_METHOD, 'squash')
})

tap.test('MERGE_METHOD should be correct for valid input', async t => {
  const { getInputs } = tap.mock('../src/util', {
    '@actions/core': {
      ...coreStubs,
      'getInput': () => 'merge',
    }
  })
  t.equal(getInputs().MERGE_METHOD, 'merge')
})

tap.test('getPackageName should get package name from branch with repo name', async t => {
  t.equal(getPackageName("dependabot/github_actions/fastify/github-action-merge-dependabot-2.6.0"), "github-action-merge-dependabot")
})

tap.test('getPackageName should get package name from branch', async t => {
  t.equal(getPackageName("dependabot/npm_and_yarn/pkg-0.0.1"), "pkg")
})

tap.test('getPackageName should throw an error for invalid branch names', async t => {
  t.throws(() => getPackageName("invalidbranchname"), new Error('Invalid branch name, package name or version not found'))
})

tap.test('isCommitHash should detect variable length SHA1 hashes properly', async t => {
  t.ok(isCommitHash('044e827'))
  t.ok(isCommitHash('cc221b3'))
  t.ok(isCommitHash('0000cc221b0000cc221b0000cc221b0000cc221b'))
  t.notOk(isCommitHash('0000cc221b0000cc221b0000cc221b0000cc221b2')) // Hash larger than 40 chars, the SHA1 hash length
  t.notOk(isCommitHash('ccx21b3'))
  t.notOk(isCommitHash('cc-21b3'))
})

tap.test('isSemverValid should detect semver versions appropriately', async t => {
  t.ok(isValidSemver('2'))
  t.ok(isValidSemver('2.0.0'))
  t.notOk(isValidSemver('2.0.0.0'))
  t.notOk(isValidSemver('044e827'))
})
