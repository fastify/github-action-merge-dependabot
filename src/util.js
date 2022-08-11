'use strict'

const semverValid = require('semver/functions/valid')
const semverCoerce = require('semver/functions/coerce')
const core = require('@actions/core')

const { getTargetInput } = require('./getTargetInput')
const { logWarning } = require('./log')

const mergeMethods = {
  merge: 'merge',
  squash: 'squash',
  rebase: 'rebase',
}

const getMergeMethod = () => {
  const input = core.getInput('merge-method')

  if (!input || !mergeMethods[input]) {
    logWarning(
      'merge-method input is ignored because it is malformed, defaulting to `squash`.'
    )
    return mergeMethods.squash
  }

  return mergeMethods[input]
}

const parseCommaOrSemicolonSeparatedValue = value => {
  return value ? value.split(/[;,]/).map(el => el.trim()) : []
}

exports.getInputs = () => ({
  GITHUB_TOKEN: core.getInput('github-token', { required: true }),
  MERGE_METHOD: getMergeMethod(),
  EXCLUDE_PKGS: parseCommaOrSemicolonSeparatedValue(core.getInput('exclude')),
  MERGE_COMMENT: core.getInput('merge-comment') || '',
  APPROVE_ONLY: /true/i.test(core.getInput('approve-only')),
  TARGET: getTargetInput(core.getInput('target')),
  PR_NUMBER: core.getInput('pr-number'),
})

/**
 * Get a package name from a branch name.
 * Dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
 * or "dependabot/github_actions/fastify/github-action-merge-dependabot-2.6.0"
 * @param {String} branchName
 * @returns Package name extracted from branch
 */
exports.getPackageName = branchName => {
  const nameWithVersion = branchName.split('/').pop().split('-')
  const version = nameWithVersion.pop()
  const packageName = nameWithVersion.join('-')

  if (!packageName || !version) {
    throw new Error('Invalid branch name, package name or version not found')
  }

  return packageName
}

/**
 * Checks if the string is a SHA1 commit hash.
 * Usually github commit hashes are 7 chars long, but in case this change someday
 * it's checking for the maximum length of a SHA1 hash (40 hexadecimal chars)
 * @param {String} version
 * @returns Boolean indicating whether version
 */
exports.isCommitHash = function (version) {
  return /^[a-f0-9]{5,40}$/.test(version)
}

/**
 * Checks if a version is a valid semver version.
 * Uses loose: true and replace `v`, `~`, `^` charactes to make function a bit
 * less restrictive regarding the accepted inputs
 * @param {String} version
 * @returns Boolean indicating whether version is valid
 */
exports.isValidSemver = function (version) {
  const isNumber = !isNaN(+version)

  if (isNumber) {
    return semverValid(semverCoerce(version))
  }

  return semverValid(version.replace(/[\^~v]/g, ''), { loose: true })
}
