'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const fetch = require('node-fetch')
const semverMajor = require('semver/functions/major')

const checkTargetMatchToPR = require('./checkTargetMatchToPR')
const getPullRequest = require('./getPullRequest')
const { logInfo, logWarning, logError } = require('./log')
const { getInputs } = require('./util')
const { targetOptions } = require('./getTargetInput')

const {
  GITHUB_TOKEN,
  MERGE_METHOD,
  EXCLUDE_PKGS,
  MERGE_COMMENT,
  APPROVE_ONLY,
  API_URL,
  DEFAULT_API_URL,
  TARGET,
  PR_NUMBER,
} = getInputs()

const GITHUB_APP_URL = 'https://github.com/apps/dependabot-merge-action'

module.exports = async function run() {
  try {
    const { pull_request } = github.context.payload

    if (!pull_request && !PR_NUMBER) {
      return logError(
        'This action must be used in the context of a Pull Request or with a Pull Request number'
      )
    }

    const pr =
      pull_request ||
      (await getPullRequest({
        pullRequestNumber: PR_NUMBER,
        githubToken: GITHUB_TOKEN,
      }))

    const isDependabotPR = pr.user.login === 'dependabot[bot]'

    if (!isDependabotPR) {
      return logWarning('Not a dependabot PR, skipping.')
    }

    if (TARGET !== targetOptions.any) {
      const isTargetMatchToPR = checkTargetMatchToPR(pr.title, TARGET)

      if (!isTargetMatchToPR) {
        return logWarning('Target specified does not match to PR, skipping.')
      }
    }

    const { name: pkgName, version } = getPackageDetails(pr)
    const upgradeMessage = `Cannot automerge github-action-merge-dependabot ${version} major release.
  Read how to upgrade it manually:
  https://github.com/fastify/github-action-merge-dependabot/releases/tag/v${version}`

    if (EXCLUDE_PKGS.includes(pkgName)) {
      return logInfo(`${pkgName} is excluded, skipping.`)
    }

    if (API_URL !== DEFAULT_API_URL &&
      pkgName === 'github-action-merge-dependabot' &&
      isMajorRelease(pr)) {
      logWarning(upgradeMessage)
      core.setFailed(upgradeMessage)
      return
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        authorization: `token ${GITHUB_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        pullRequestNumber: pr.number,
        approveOnly: APPROVE_ONLY,
        excludePackages: EXCLUDE_PKGS,
        approveComment: MERGE_COMMENT,
        mergeMethod: MERGE_METHOD,
      }),
    })

    const responseText = await response.text()

    if (response.status === 400) {
      logWarning(`Please ensure that Github App is installed ${GITHUB_APP_URL}`)
    }

    if (response.status === 422) {
      logWarning(upgradeMessage)
    }

    if (!response.ok) {
      throw new Error(
        `Request failed with status code ${response.status}: ${responseText}`
      )
    }

    logInfo(responseText)
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
    if (semverMajor(oldVersion) !== semverMajor(newVersion)) {
      return true
    }
  }
  return false
}
