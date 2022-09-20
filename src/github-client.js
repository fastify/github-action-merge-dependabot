'use strict'
const { getOctokit } = require('@actions/github')

function githubClient(context, githubToken) {
  const payload = context.payload
  const octokit = getOctokit(githubToken)

  const repo = payload.repository
  const owner = repo.owner.login
  const repoName = repo.name

  return {
    async getPullRequest(pullRequestNumber) {
      const { data: pullRequest } = await octokit.rest.pulls.get({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
      })
      return pullRequest
    },

    async approvePullRequest(pullRequestNumber, approveComment) {
      const { data } = await octokit.rest.pulls.createReview({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
        event: 'APPROVE',
        body: approveComment,
      })
      // todo assert
      return data
    },

    async mergePullRequest(pullRequestNumber, mergeMethod) {
      const { data } = await octokit.rest.pulls.merge({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
        merge_method: mergeMethod,
      })
      // todo assert
      return data
    },

    async getPullRequestDiff(pullRequestNumber) {
      const { data: pullRequest } = await octokit.rest.pulls.get({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
        mediaType: {
          format: 'diff',
        },
      })
      return pullRequest
    },

    async getPullRequestCommits(pullRequestNumber) {
      const { data } = await octokit.rest.pulls.listCommits({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
      })

      return data
    },
  }
}

module.exports = { githubClient }
