'use strict'

const { test, afterEach } = require('node:test')
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

afterEach(() => {
  sinon.resetHistory()
})

test('githubClient', async t => {
  await t.test('getPullRequest', async (t) => {
    const result = await githubClient(githubStub, contextStub).getPullRequest(
      PR_NUMBER
    )
    t.assert.deepStrictEqual(result, data)

    sinon.assert.calledWith(octokitStubs.get, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
    })
  })

  await t.test('approvePullRequest', async (t) => {
    const comment = 'Test pull request comment'
    const result = await githubClient(
      githubStub,
      contextStub
    ).approvePullRequest(PR_NUMBER, comment)
    t.assert.deepStrictEqual(result, data)

    sinon.assert.calledWith(octokitStubs.createReview, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
      event: 'APPROVE',
      body: comment,
    })
  })

  await t.test('mergePullRequest', async (t) => {
    const method = 'squash'
    const result = await githubClient(githubStub, contextStub).mergePullRequest(
      PR_NUMBER,
      method
    )
    t.assert.deepStrictEqual(result, data)

    sinon.assert.calledWith(octokitStubs.merge, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
      merge_method: method,
    })
  })

  await t.test('enableAutoMergePullRequest', async (t) => {
    const method = 'squash'
    const result = await githubClient(
      githubStub,
      contextStub
    ).enableAutoMergePullRequest(PR_NODE_ID, method)
    t.assert.deepStrictEqual(result, data)

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

  await t.test('getPullRequestDiff', async (t) => {
    const result = await githubClient(
      githubStub,
      contextStub
    ).getPullRequestDiff(PR_NUMBER)
    t.assert.deepStrictEqual(result, data)

    sinon.assert.calledWith(octokitStubs.get, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
      mediaType: {
        format: 'diff',
      },
    })
  })

  await t.test('getPullRequestCommits', async (t) => {
    const result = await githubClient(
      githubStub,
      contextStub
    ).getPullRequestCommits(PR_NUMBER)
    t.assert.deepStrictEqual(result, data)

    sinon.assert.calledWith(octokitStubs.listCommits, {
      owner: githubContext.repository.owner.login,
      repo: githubContext.repository.name,
      pull_number: PR_NUMBER,
    })
  })
})
