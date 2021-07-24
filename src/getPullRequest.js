'use strict'

const github = require('@actions/github')

const { getInputs } = require('./util')
const { logError } = require('./log')

const { GITHUB_TOKEN, PR_NUMBER } = getInputs()

const getPullRequest = async () => {
  const payload = github.context.payload

  // Checks for "workflow" context to set the pull request, otherwise defaults to checking "pull request" context
  if (payload.workflow) {
    if (!PR_NUMBER || (PR_NUMBER && isNaN(PR_NUMBER))) {
      return logError(
        'Missing or invalid pull request number. Please make sure you are using a valid pull request number'
      )
    }

    const octokit = github.getOctokit(GITHUB_TOKEN)

    const repo = payload.repository
    const owner = repo.owner.login
    const repoName = repo.name

    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo: repoName,
      pull_number: PR_NUMBER,
    })

    return pullRequest
  } else {
    return payload.pull_request
  }
}

module.exports = getPullRequest
