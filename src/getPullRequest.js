'use strict'

const github = require('@actions/github')

const { getInputs } = require('./util')

const { GITHUB_TOKEN } = getInputs()

const getPullRequest = async (owner, repoName, pullRequestNumber) => {
  const octokit = github.getOctokit(GITHUB_TOKEN)

  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo: repoName,
    pull_number: pullRequestNumber,
  })

  return pullRequest
}

module.exports = getPullRequest
