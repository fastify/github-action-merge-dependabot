'use strict'

const { mapUpdateType } = require('./mapUpdateType')
const { logWarning } = require('./log')

const mergeMethods = {
  merge: 'merge',
  squash: 'squash',
  rebase: 'rebase',
}

const getMergeMethod = inputs => {
  const input = inputs['merge-method']

  if (!input) {
    return mergeMethods.squash
  }

  if (!mergeMethods[input]) {
    logWarning(
      'merge-method input is ignored because it is malformed, defaulting to `squash`.',
    )
    return mergeMethods.squash
  }

  return mergeMethods[input]
}

const parseCommaOrSemicolonSeparatedValue = value => {
  return value ? value.split(/[;,]/).map(el => el.trim()) : []
}

exports.parseCommaOrSemicolonSeparatedValue =
  parseCommaOrSemicolonSeparatedValue

exports.getInputs = inputs => {
  if (!inputs) {
    throw new Error('Invalid inputs object passed to getInputs')
  }

  return {
    MERGE_METHOD: getMergeMethod(inputs),
    EXCLUDE_PKGS: parseCommaOrSemicolonSeparatedValue(inputs['exclude']),
    MERGE_COMMENT: inputs['merge-comment'] || '',
    APPROVE_ONLY: /true/i.test(inputs['approve-only']),
    USE_GITHUB_AUTO_MERGE: /true/i.test(inputs['use-github-auto-merge']),
    TARGET: mapUpdateType(inputs['target']),
    PR_NUMBER: inputs['pr-number'],
    SKIP_COMMIT_VERIFICATION: /true/i.test(inputs['skip-commit-verification']),
    SKIP_VERIFICATION: /true/i.test(inputs['skip-verification']),
  }
}

exports.MERGE_STATUS = {
  approved: 'approved',
  merged: 'merged',
  mergeFailed: 'merge_failed',
  skippedCommitVerificationFailed: 'skipped:commit_verification_failed',
  skippedNotADependabotPr: 'skipped:not_a_dependabot_pr',
  skippedCannotUpdateMajor: 'skipped:cannot_update_major',
  skippedBumpHigherThanTarget: 'skipped:bump_higher_than_target',
  skippedPackageExcluded: 'skipped:packaged_excluded',
  skippedInvalidVersion: 'skipped:invalid_semver',
}

exports.MERGE_STATUS_KEY = 'merge_status'
