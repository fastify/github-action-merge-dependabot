'use strict'

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

const parseCommaSeparatedValue = (value) => {
  return value.split(',').map(el => el.trim());
}

exports.getInputs = () => ({
  GITHUB_TOKEN: core.getInput('github-token', { required: true }),
  MERGE_METHOD: getMergeMethod(),
  EXCLUDE_PKGS: parseCommaSeparatedValue(core.getInput('exclude')) || [],
  MERGE_COMMENT: core.getInput('merge-comment') || '',
  APPROVE_ONLY: /true/i.test(core.getInput('approve-only')),
  TARGET: getTargetInput(core.getInput('target')),
  PR_NUMBER: core.getInput('pr-number'),
})
