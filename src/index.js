'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const fetch = require('node-fetch')

const checkTargetMatchToPR = require('./checkTargetMatchToPR')
const getPullRequest = require('./getPullRequest')
const { logInfo, logWarning, logError } = require('./log')
const { getInputs } = require('./util')

const {
  GITHUB_TOKEN,
  MERGE_METHOD,
  EXCLUDE_PKGS,
  MERGE_COMMENT,
  APPROVE_ONLY,
  API_URL,
  TARGET,
  PR_NUMBER,
} = getInputs()

const GITHUB_APP_URL = 'https://github.com/apps/dependabot-merge-action'

async function run() {
  try {
    const { pull_request, workflow } = github.context.payload

    const isSupportedContext = pull_request || workflow

    if (!isSupportedContext) {
      return logError(
        'This action must be used in the context of a Pull Request or a Workflow Dispatch event'
      )
    }

    let pr = pull_request

    const pullRequestNumber = PR_NUMBER || pr.number

    if (!pullRequestNumber) {
      return logError(
        'No pull request number has been found. Please make sure a pull request number has been provided'
      )
    }

    // If this is in a workflow dispatch context, re-assign the pr variable based on response from octokit
    if (workflow) {
      const repo = github.context.payload.repository
      const owner = repo.owner.login
      const repoName = repo.name

      pr = await getPullRequest(owner, repoName, pullRequestNumber)
    }

    const isDependabotPR = pr.user.login === 'dependabot[bot]'

    if (!isDependabotPR) {
      return logWarning('Not a dependabot PR, skipping.')
    }

    const isTargetMatchToPR = checkTargetMatchToPR(pr.title, TARGET)

    if (!isTargetMatchToPR) {
      return logWarning('Target specified does not match to PR, skipping.')
    }

    // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
    const pkgName = pr.head.ref.split('/').pop().split('-').shift()

    if (EXCLUDE_PKGS.includes(pkgName)) {
      return logInfo(`${pkgName} is excluded, skipping.`)
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        authorization: `token ${GITHUB_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        pullRequestNumber,
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

run()
