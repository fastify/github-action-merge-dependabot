'use strict'

const github = require('@actions/github')

const getPullRequest = async ({ pullRequestNumber, githubToken }) => {
  const payload = github.context.payload
  const octokit = github.getOctokit(githubToken)

  const repo = payload.repository
  const owner = repo.owner.login
  const repoName = repo.name

  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo: repoName,
    pull_number: pullRequestNumber,
  })

  return pullRequest
}

module.exports = getPullRequest
