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


    if (TARGET !== 'any') {
      const isTargetMatchToPR = checkTargetMatchToPR(pr.title, TARGET)

      console.log({isTargetMatchToPR})
      if (!isTargetMatchToPR) {
        return logWarning('Target specified does not match to PR, skipping.')
      }
    } else {
      console.log('Skipping target check')
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

    if (!response.ok) {
      throw new Error(
        `Request failed with status code ${response.status}: ${responseText}`
      )
    }

    logInfo(responseText)
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }
}

run()
