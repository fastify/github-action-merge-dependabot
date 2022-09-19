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
      'merge-method input is ignored because it is malformed, defaulting to `squash`.'
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
    GITHUB_TOKEN: inputs['github-token'],
    MERGE_METHOD: getMergeMethod(inputs),
    EXCLUDE_PKGS: parseCommaOrSemicolonSeparatedValue(inputs['exclude']),
    MERGE_COMMENT: inputs['merge-comment'] || '',
    APPROVE_ONLY: /true/i.test(inputs['approve-only']),
    TARGET: mapUpdateType(inputs['target']),
    PR_NUMBER: inputs['pr-number'],
  }
}
