'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const fetch = require('node-fetch')

const githubActionClient = require('./github-action-client')

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

    const client = githubActionClient(GITHUB_TOKEN)


    // TODO do i have the right permissions?

    const pr = pull_request || (await client.getPullRequest(PR_NUMBER))

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

    // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
    const pkgName = pr.head.ref.split('/').pop().split('-').shift()

    if (EXCLUDE_PKGS.includes(pkgName)) {
      return logInfo(`${pkgName} is excluded, skipping.`)
    }

    await client.approvePullRequest(pr.number, MERGE_COMMENT)
    if (APPROVE_ONLY) {
      return 'Approving only'
    }

    await client.mergePullRequest(pr.number, MERGE_METHOD)


    // if (!response.ok) {
    //   throw new Error(
    //     `Request failed with status code ${response.status}: ${responseText}`
    //   )
    // }

    logInfo('Dependabot merge completed')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
