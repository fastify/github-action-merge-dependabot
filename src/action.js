'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const semverMajor = require('semver/functions/major')
const semverCoerce = require('semver/functions/coerce')

const { githubClient } = require('./github-client')
const checkTargetMatchToPR = require('./checkTargetMatchToPR')
const { logInfo, logWarning, logError } = require('./log')
const { getInputs } = require('./util')
const { targetOptions } = require('./getTargetInput')

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

    if (TARGET !== targetOptions.any) {
      logInfo(`Checking if PR title [${pr.title}] has target ${TARGET}`)
      const isTargetMatchToPR = checkTargetMatchToPR(pr.title, TARGET)

      if (!isTargetMatchToPR) {
        return logWarning('Target specified does not match to PR, skipping.')
      }
    }

    const { name: pkgName, version } = getPackageDetails(pr)
    const upgradeMessage = `Cannot automerge github-action-merge-dependabot ${version} major release.
  Read how to upgrade it manually:
  https://github.com/fastify/github-action-merge-dependabot#how-to-upgrade-from-2x-to-new-3x`

    if (EXCLUDE_PKGS.includes(pkgName)) {
      return logInfo(`${pkgName} is excluded, skipping.`)
    }

    if (pkgName === 'github-action-merge-dependabot' && isMajorRelease(pr)) {
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

function getPackageDetails(pullRequest) {
  // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
  // or "dependabot/github_actions/fastify/github-action-merge-dependabot-2.6.0"
  const nameAndVersion = pullRequest.head.ref.split('/').pop().split('-')
  const version = nameAndVersion.pop() // remove the version
  return {
    name: nameAndVersion.join('-'),
    version
  }
}

function isMajorRelease(pullRequest) {
  const expression = /bump \S+ from (\S+) to (\S+)/i
  const match = expression.exec(pullRequest.title)
  if (match) {
    const [, oldVersion, newVersion] = match
    const oldVersionSemver = semverCoerce(oldVersion)
    const newVersionSemver = semverCoerce(newVersion)
    if (semverMajor(oldVersionSemver) !== semverMajor(newVersionSemver)) {
      return true
    }
  }
  return false
}
