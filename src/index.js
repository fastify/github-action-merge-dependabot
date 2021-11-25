'use strict'

const core = require('@actions/core')
const github = require('@actions/github')

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
  TARGET,
  PR_NUMBER,
} = getInputs()


async function run() {
  try {
    const { pull_request } = github.context.payload

    if (!pull_request && !PR_NUMBER) {
      return logError(
        'This action must be used in the context of a Pull Request or with a Pull Request number'
      )
    }

    const client = githubActionClient(GITHUB_TOKEN)

    // TODO do i have the right GH permissions?

    const pr = pull_request || (await client.getPullRequest(PR_NUMBER))

    const isTest = process.env.NODE_ENV === 'test-ga-action'
    const isDependabotPR = pr.user.login === 'dependabot[bot]' || isTest
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
      return logInfo('Approving only')
    }

    await client.mergePullRequest(pr.number, MERGE_METHOD)
    logInfo('Dependabot merge completed')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
