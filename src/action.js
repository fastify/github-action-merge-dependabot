'use strict'

const core = require('@actions/core')
const toolkit = require('actions-toolkit')

const packageInfo = require('../package.json')
const { githubClient } = require('./github-client')
const { logInfo, logWarning, logError } = require('./log')
const { getInputs, parseCommaOrSemicolonSeparatedValue } = require('./util')
const { verifyCommits } = require('./verifyCommitSignatures')
const { dependabotAuthor } = require('./getDependabotDetails')
const { updateTypes } = require('./mapUpdateType')
const { updateTypesPriority } = require('./mapUpdateType')

module.exports = async function run({
  github,
  context,
  inputs,
  dependabotMetadata,
}) {
  const { updateType } = dependabotMetadata
  const dependencyNames = parseCommaOrSemicolonSeparatedValue(
    dependabotMetadata.dependencyNames
  )

  const {
    MERGE_METHOD,
    EXCLUDE_PKGS,
    MERGE_COMMENT,
    APPROVE_ONLY,
    TARGET,
    PR_NUMBER,
  } = getInputs(inputs)

  try {
    toolkit.logActionRefWarning()

    const { pull_request } = context.payload

    if (!pull_request && !PR_NUMBER) {
      return logError(
        'This action must be used in the context of a Pull Request or with a Pull Request number'
      )
    }

    const client = githubClient(github, context)
    const pr = pull_request || (await client.getPullRequest(PR_NUMBER))

    const isDependabotPR = pr.user.login === dependabotAuthor
    if (!isDependabotPR) {
      return logWarning('Not a dependabot PR, skipping.')
    }

    const commits = await client.getPullRequestCommits(pr.number)
    if (!commits.every(commit => commit.author?.login === dependabotAuthor)) {
      return logWarning('PR contains non dependabot commits, skipping.')
    }

    try {
      await verifyCommits(commits)
    } catch {
      return logWarning(
        'PR contains invalid dependabot commit signatures, skipping.'
      )
    }

    if (
      TARGET !== updateTypes.any &&
      updateTypesPriority.indexOf(updateType) >
        updateTypesPriority.indexOf(TARGET)
    ) {
      core.setFailed(
        `Semver bump is higher than allowed in TARGET.
Tried to do a ${updateType} update but the max allowed is ${TARGET} `
      )
      return
    }

    const changedExcludedPackages = EXCLUDE_PKGS.filter(
      pkg => dependencyNames.indexOf(pkg) > -1
    )

    // TODO: Improve error message for excluded packages?
    if (changedExcludedPackages.length > 0) {
      return logInfo(`${changedExcludedPackages.length} package(s) excluded: \
${changedExcludedPackages.join(', ')}. Skipping.`)
    }

    if (
      dependencyNames.indexOf(packageInfo.name) > -1 &&
      updateType === updateTypes.major
    ) {
      const upgradeMessage = `Cannot automerge ${packageInfo.name} major release.
    Read how to upgrade it manually:
    https://github.com/fastify/${packageInfo.name}#how-to-upgrade-from-2x-to-new-3x`

      core.setFailed(upgradeMessage)
      return
    }

    await client.approvePullRequest(pr.number, MERGE_COMMENT)
    if (APPROVE_ONLY) {
      return logInfo(
        'APPROVE_ONLY set, PR was approved but it will not be merged'
      )
    }

    await client.mergePullRequest(pr.number, MERGE_METHOD)
    logInfo('Dependabot merge completed')
  } catch (error) {
    core.setFailed(error.message)
  }
}
