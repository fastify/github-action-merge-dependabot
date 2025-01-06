'use strict'

const core = require('@actions/core')
const toolkit = require('actions-toolkit')

const packageInfo = require('../package.json')
const { githubClient } = require('./github-client')
const { logInfo, logWarning, logError } = require('./log')
const {
  MERGE_STATUS,
  MERGE_STATUS_KEY,
  getInputs,
  parseCommaOrSemicolonSeparatedValue,
  getTarget,
} = require('./util')
const { verifyCommits } = require('./verifyCommitSignatures')
const { dependabotAuthor } = require('./getDependabotDetails')
const { updateTypes } = require('./mapUpdateType')
const { updateTypesPriority } = require('./mapUpdateType')

module.exports = async function run ({
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
    USE_GITHUB_AUTO_MERGE,
    TARGET,
    TARGET_DEV,
    TARGET_PROD,
    TARGET_INDIRECT,
    PR_NUMBER,
    SKIP_COMMIT_VERIFICATION,
    SKIP_VERIFICATION,
  } = getInputs(inputs)

  try {
    toolkit.logActionRefWarning()

    const PULLREQUEST = context.payload.pull_request
    if (!PULLREQUEST && !PR_NUMBER) {
      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.skippedNotADependabotPr)
      return logError(
        'This action must be used in the context of a Pull Request or with a Pull Request number'
      )
    }

    const client = githubClient(github, context)
    const pr = PULLREQUEST || (await client.getPullRequest(PR_NUMBER))

    const isDependabotPR = pr.user.login === dependabotAuthor
    if (!SKIP_VERIFICATION && !isDependabotPR) {
      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.skippedNotADependabotPr)
      return logWarning('Not a dependabot PR, skipping.')
    }

    const commits = await client.getPullRequestCommits(pr.number)
    if (
      !SKIP_VERIFICATION &&
      !commits.every(commit => commit.author?.login === dependabotAuthor)
    ) {
      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.skippedNotADependabotPr)
      return logWarning('PR contains non dependabot commits, skipping.')
    }

    if (!SKIP_COMMIT_VERIFICATION && !SKIP_VERIFICATION) {
      try {
        verifyCommits(commits)
      } catch {
        core.setOutput(
          MERGE_STATUS_KEY,
          MERGE_STATUS.skippedCommitVerificationFailed
        )
        return logWarning(
          'PR contains invalid dependabot commit signatures, skipping.'
        )
      }
    }

    const target = getTarget(
      { TARGET, TARGET_DEV, TARGET_PROD, TARGET_INDIRECT },
      dependabotMetadata
    )

    if (
      target !== updateTypes.any &&
      updateTypesPriority.indexOf(updateType) < 0
    ) {
      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.skippedInvalidVersion)
      logWarning(`Semver bump '${updateType}' is invalid!`)
      return
    }

    if (
      target !== updateTypes.any &&
      updateTypesPriority.indexOf(updateType) >
        updateTypesPriority.indexOf(target)
    ) {
      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.skippedBumpHigherThanTarget)
      logWarning(`Semver bump is higher than allowed in TARGET.
Tried to do a '${updateType}' update but the max allowed is '${target}'`)
      return
    }

    const changedExcludedPackages = EXCLUDE_PKGS.filter(
      pkg => dependencyNames.indexOf(pkg) > -1
    )

    // TODO: Improve error message for excluded packages?
    if (changedExcludedPackages.length > 0) {
      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.skippedPackageExcluded)
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

      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.skippedCannotUpdateMajor)
      core.setFailed(upgradeMessage)
      return
    }

    await client.approvePullRequest(pr.number, MERGE_COMMENT)
    if (APPROVE_ONLY) {
      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.approved)
      return logInfo(
        'APPROVE_ONLY set, PR was approved but it will not be merged'
      )
    }

    if (USE_GITHUB_AUTO_MERGE) {
      await client.enableAutoMergePullRequest(pr.node_id, MERGE_METHOD)
      core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.autoMerge)
      return logInfo('USE_GITHUB_AUTO_MERGE set, PR was marked as auto-merge')
    }

    await client.mergePullRequest(pr.number, MERGE_METHOD)
    core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.merged)
    logInfo('Dependabot merge completed')
  } catch (error) {
    core.setFailed(error.message)
    core.setOutput(MERGE_STATUS_KEY, MERGE_STATUS.mergeFailed)
  }
}
