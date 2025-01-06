'use strict'

function githubClient (github, context) {
  const payload = context.payload

  const repo = payload.repository
  const owner = repo.owner.login
  const repoName = repo.name

  return {
    async getPullRequest (pullRequestNumber) {
      const { data: pullRequest } = await github.rest.pulls.get({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
      })
      return pullRequest
    },

    async approvePullRequest (pullRequestNumber, approveComment) {
      const { data } = await github.rest.pulls.createReview({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
        event: 'APPROVE',
        body: approveComment,
      })
      // todo assert
      return data
    },

    async mergePullRequest (pullRequestNumber, mergeMethod) {
      const { data } = await github.rest.pulls.merge({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
        merge_method: mergeMethod,
      })
      // todo assert
      return data
    },

    async enableAutoMergePullRequest (pullRequestId, mergeMethod) {
      const query = `
mutation ($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
  enablePullRequestAutoMerge(
    input: { pullRequestId: $pullRequestId, mergeMethod: $mergeMethod }
  ) {
    pullRequest {
      autoMergeRequest {
        enabledAt
        enabledBy {
          login
        }
      }
    }
  }
}
`
      const { data } = await github.graphql(query, {
        pullRequestId,
        mergeMethod: mergeMethod.toUpperCase(),
      })
      return data
    },

    async getPullRequestDiff (pullRequestNumber) {
      const { data: pullRequest } = await github.rest.pulls.get({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
        mediaType: {
          format: 'diff',
        },
      })
      return pullRequest
    },

    async getPullRequestCommits (pullRequestNumber) {
      const { data } = await github.rest.pulls.listCommits({
        owner,
        repo: repoName,
        pull_number: pullRequestNumber,
      })

      return data
    },
  }
}

module.exports = { githubClient }
