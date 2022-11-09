'use strict'

const tap = require('tap')
const sinon = require('sinon')
const { githubClient } = require('../src/github-client')

const githubContext = {
  repository: {
    owner: {
      login: 'owner-login.',
    },
    name: 'repository-name',
  },
}

const data = 'octokit-result'

const octokitStubs = {
  get: sinon.stub().returns(Promise.resolve({ data })),
  createReview: sinon.stub().returns(Promise.resolve({ data })),
  merge: sinon.stub().returns(Promise.resolve({ data })),
  listCommits: sinon.stub().returns(Promise.resolve({ data })),
}
const contextStub = { payload: githubContext }
const githubStub = {
  rest: {
    pulls: octokitStubs,
  },
  graphql: sinon.stub().returns(Promise.resolve({ data })),
}

const PR_NUMBER = Math.floor(Math.random() * 10)
const PR_NODE_ID = Math.floor(Math.random() * 10)

tap.afterEach(() => {
  sinon.resetHistory()
})

tap.test('githubClient', async t => {
  t.test('getPullRequest', async () => {
    const result = await githubClient(githubStub, contextStub).getPullRequest(
      PR_NUMBER
    )
    tap.equal(result, data)

    sinon.assert.calledWith(octokitStubs.get, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
    })
  })

  t.test('approvePullRequest', async () => {
    const comment = 'Test pull request comment'
    const result = await githubClient(
      githubStub,
      contextStub
    ).approvePullRequest(PR_NUMBER, comment)
    tap.equal(result, data)

    sinon.assert.calledWith(octokitStubs.createReview, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
      event: 'APPROVE',
      body: comment,
    })
  })

  t.test('mergePullRequest', async () => {
    const method = 'squash'
    const result = await githubClient(githubStub, contextStub).mergePullRequest(
      PR_NUMBER,
      method
    )
    tap.equal(result, data)

    sinon.assert.calledWith(octokitStubs.merge, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
      merge_method: method,
    })
  })

  t.test('enableAutoMergePullRequest', async () => {
    const method = 'squash'
    const result = await githubClient(
      githubStub,
      contextStub
    ).enableAutoMergePullRequest(PR_NODE_ID, method)
    tap.equal(result, data)

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

    sinon.assert.calledWith(githubStub.graphql, query, {
      pullRequestId: PR_NODE_ID,
      mergeMethod: method.toUpperCase(),
    })
  })

  t.test('getPullRequestDiff', async () => {
    const result = await githubClient(
      githubStub,
      contextStub
    ).getPullRequestDiff(PR_NUMBER)
    tap.equal(result, data)

    sinon.assert.calledWith(octokitStubs.get, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
      mediaType: {
        format: 'diff',
      },
    })
  })

  t.test('getPullRequestCommits', async () => {
    const result = await githubClient(
      githubStub,
      contextStub
    ).getPullRequestCommits(PR_NUMBER)
    tap.equal(result, data)

    sinon.assert.calledWith(octokitStubs.listCommits, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
    })
  })
})
