'use strict'

const github = require('@actions/github')

function githubClient(githubToken) {
  const payload = github.context.payload
  const octokit = github.getOctokit(githubToken)

  const repo = payload.repository
  const owner = repo.owner.login
  const repoName = repo.name

  return {
    async getPullRequest(pullRequestNumber) {
      // https://docs.github.com/en/rest/reference/pulls#get-a-pull-request
      const { data: pullRequest } = await octokit.rest.pulls.get({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
      })
      return pullRequest
    },

    async approvePullRequest(pullRequestNumber, approveComment) {
      // https://docs.github.com/en/rest/reference/pulls#create-a-review-for-a-pull-request
      const { data } = await octokit.rest.pulls.createReview({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
        event: 'APPROVE',
        body: approveComment
      })
      return data
    },

    async mergePullRequest(pullRequestNumber, mergeMethod) {
      // https://docs.github.com/en/rest/reference/pulls#merge-a-pull-request
      const { data } = await octokit.rest.pulls.merge({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
        merge_method: mergeMethod,
      })
      return data
    }
  }

}

module.exports = { githubClient }