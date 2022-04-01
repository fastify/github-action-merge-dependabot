'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const semverDiff = require('semver/functions/diff')
const semverCoerce = require('semver/functions/coerce')
const toolkit = require('actions-toolkit')

const { githubClient } = require('./github-client')
const { logInfo, logWarning, logError } = require('./log')
const { getInputs } = require('./util')
const { targetOptions } = require('./getTargetInput')
const {
  getModuleVersionChanges,
  checkModuleVersionChanges,
} = require('./moduleVersionChanges')

const {
  GITHUB_TOKEN,
  MERGE_METHOD,
  EXCLUDE_PKGS,
  MERGE_COMMENT,
  APPROVE_ONLY,
  TARGET,
  PR_NUMBER,
} = getInputs()

module.exports = async function run() {
  try {
    toolkit.logActionRefWarning()

    const { pull_request } = github.context.payload

    if (!pull_request && !PR_NUMBER) {
      return logError(
        'This action must be used in the context of a Pull Request or with a Pull Request number'
      )
    }

    const client = githubClient(GITHUB_TOKEN)

    const pr = pull_request || (await client.getPullRequest(PR_NUMBER))

    const isDependabotPR = pr.user.login === 'dependabot[bot]'
    if (!isDependabotPR) {
      return logWarning('Not a dependabot PR, skipping.')
    }

    const prDiff = await client.getPullRequestDiff(pr.number)
    const moduleChanges = getModuleVersionChanges(prDiff)

    if (TARGET !== targetOptions.any) {
      logInfo(`Checking if the changes in the PR can be merged`)

      const isTargetMatchToPR = checkModuleVersionChanges(moduleChanges, TARGET)
      if (!isTargetMatchToPR) {
        return logWarning('Target specified does not match to PR, skipping.')
      }
    }

    const changedExcludedPackages = EXCLUDE_PKGS.filter((pkg) => pkg in moduleChanges)
    if (changedExcludedPackages.length > 0) {
      return logInfo(`${changedExcludedPackages.length} package(s) excluded: \
${changedExcludedPackages.join(', ')}. Skipping.`)
    }

    const thisModuleChanges = moduleChanges['github-action-merge-dependabot']
    if (thisModuleChanges && isAMajorReleaseBump(thisModuleChanges)) {
      const version = moduleChanges['github-action-merge-dependabot'].insert
      const upgradeMessage = `Cannot automerge github-action-merge-dependabot ${version} major release.
    Read how to upgrade it manually:
    https://github.com/fastify/github-action-merge-dependabot#how-to-upgrade-from-2x-to-new-3x`

      core.setFailed(upgradeMessage)
      return
    }

    await client.approvePullRequest(pr.number, MERGE_COMMENT)
    if (APPROVE_ONLY) {
      return logInfo('Approving only')
    }

    await client.mergePullRequest(pr.number, MERGE_METHOD)
    logInfo('Dependabot merge completed')
  } catch (error) {
    core.setFailed(error.message)
  }
}

function isAMajorReleaseBump(change) {
  const from = change.delete
  const to = change.insert
  if (!from || !to) {
    return false
  }

  const diff = semverDiff(semverCoerce(from), semverCoerce(to))
  return diff === targetOptions.major
}
