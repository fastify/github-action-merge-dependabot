'use strict'

const tap = require('tap')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

// Stubbing modules
const core = require('@actions/core')
const toolkit = require('actions-toolkit')

const actionLog = require('../src/log')
const actionGithubClient = require('../src/github-client')
const verifyCommits = require('../src/verifyCommitSignatures')
const { updateTypes } = require('../src/mapUpdateType')

const BOT_NAME = 'dependabot[bot]'

// TODO: Share this stubs with github-client test
const data = 'octokit-result'
const octokitStubs = {
  get: sinon.stub().returns(Promise.resolve({ data })),
  createReview: sinon.stub().returns(Promise.resolve({ data })),
  merge: sinon.stub().returns(Promise.resolve({ data })),
  listCommits: sinon.stub().returns(Promise.resolve({ data })),
}

const githubStub = {
  getOctokit: () => ({
    rest: {
      pulls: octokitStubs,
    },
  }),
}

const createDependabotMetadata = (props = {}) => ({
  updateType: 'update-version:semver-minor',
  dependencyType: 'direct:development',
  dependencyNames: 'react',
  ...props,
})

function buildStubbedAction({ payload, inputs, dependabotMetadata }) {
  const coreStub = sinon.stub(core)
  const toolkitStub = sinon
    .stub(toolkit, 'logActionRefWarning')
    .get(() => sinon.stub())

  const contextStub = {
    payload: {
      pull_request: {
        user: {
          login: 'pr-user-login',
        },
      },
      repository: {
        owner: {
          login: 'owner-login.',
        },
        name: 'repository-name',
      },
    },
    ...{ payload },
  }

  const logStub = sinon.stub(actionLog)
  const prStub = sinon.stub()
  const prDiffStub = sinon.stub()
  const prCommitsStub = sinon.stub()
  const approveStub = sinon.stub()
  const mergeStub = sinon.stub()
  const enableAutoMergeStub = sinon.stub()

  const clientStub = sinon.stub(actionGithubClient, 'githubClient').returns({
    getPullRequest: prStub.resolves(),
    approvePullRequest: approveStub.resolves(),
    mergePullRequest: mergeStub.resolves(),
    enableAutoMergePullRequest: enableAutoMergeStub.resolves(),
    getPullRequestDiff: prDiffStub.resolves(),
    getPullRequestCommits: prCommitsStub.resolves([]),
  })

  const verifyCommitsStub = sinon
    .stub(verifyCommits, 'verifyCommits')
    .returns(Promise.resolve())

  const action = proxyquire('../src/action', {
    '@actions/core': coreStub,
    'actions-toolkit': toolkitStub,
    './log': logStub,
    './github-client': clientStub,
  })
  return {
    action: props =>
      action({
        github: githubStub,
        context: contextStub,
        inputs: inputs || {},
        dependabotMetadata: createDependabotMetadata(dependabotMetadata),
        ...props,
      }),
    stubs: {
      coreStub,
      githubStub,
      logStub,
      prStub,
      approveStub,
      mergeStub,
      enableAutoMergeStub,
      prCommitsStub,
      verifyCommitsStub,
    },
  }
}

tap.afterEach(() => {
  sinon.restore()
})

tap.test('should not run if a pull request number is missing', async () => {
  const { action, stubs } = buildStubbedAction({
    payload: { issue: {} },
  })
  await action()

  sinon.assert.calledWithExactly(
    stubs.logStub.logError,
    'This action must be used in the context of a Pull Request or with a Pull Request number'
  )
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test(
  'should retrieve PR info when trigger by non pull_request events',
  async () => {
    const PR_NUMBER = Math.random()
    const { action, stubs } = buildStubbedAction({
      payload: { 'not a pull_request': {} },
      inputs: { 'pr-number': PR_NUMBER },
    })

    await action()

    sinon.assert.calledOnce(stubs.prStub)
  }
)

tap.test('should skip non-dependabot PR', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: { issue: {} },
    inputs: { 'pr-number': PR_NUMBER },
  })

  stubs.prStub.resolves({
    user: {
      login: 'not dependabot',
    },
  })

  await action()

  sinon.assert.calledOnce(stubs.prStub)
  sinon.assert.calledWithExactly(
    stubs.logStub.logWarning,
    'Not a dependabot PR, skipping.'
  )
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

const prCommitsStubs = [
  {
    author: {
      login: 'not dependabot',
    },
  },
  {
    author: undefined,
  },
]

for (const prCommitsStub of prCommitsStubs) {
  tap.test('should skip PR with non dependabot commit', async () => {
    const PR_NUMBER = Math.random()
    const { action, stubs } = buildStubbedAction({
      payload: {
        pull_request: {
          user: {
            login: BOT_NAME,
          },
          number: PR_NUMBER,
        },
      },
    })

    stubs.prCommitsStub.resolves([prCommitsStub])

    await action()

    sinon.assert.calledOnce(stubs.prCommitsStub)
    sinon.assert.calledWithExactly(
      stubs.logStub.logWarning,
      'PR contains non dependabot commits, skipping.'
    )
    sinon.assert.notCalled(stubs.approveStub)
    sinon.assert.notCalled(stubs.mergeStub)
  })
}

tap.test(
  'should skip PR if dependabot commit signatures cannot be verified',
  async () => {
    const PR_NUMBER = Math.random()
    const { action, stubs } = buildStubbedAction({
      payload: {
        pull_request: {
          user: {
            login: BOT_NAME,
          },
          number: PR_NUMBER,
        },
      },
    })

    stubs.prCommitsStub.resolves([
      {
        author: {
          login: 'dependabot[bot]',
        },
      },
    ])

    stubs.verifyCommitsStub.rejects()

    await action()

    sinon.assert.calledWithExactly(
      stubs.logStub.logWarning,
      'PR contains invalid dependabot commit signatures, skipping.'
    )
    sinon.assert.notCalled(stubs.approveStub)
    sinon.assert.notCalled(stubs.mergeStub)
  }
)

tap.test('should ignore excluded package', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      },
    },
    inputs: { 'pr-number': PR_NUMBER, target: 'any', exclude: 'react' },
  })

  await action()

  sinon.assert.calledWithExactly(
    stubs.logStub.logInfo,
    '1 package(s) excluded: react. Skipping.'
  )
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('approve only should not merge', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: { issue: {} },
    inputs: {
      'pr-number': PR_NUMBER,
      target: 'any',
      'approve-only': true,
    },
  })

  stubs.prStub.resolves({
    number: PR_NUMBER,
    user: { login: BOT_NAME },
  })

  stubs.approveStub.resolves({ data: true })

  await action()

  sinon.assert.calledWithExactly(
    stubs.logStub.logInfo,
    'APPROVE_ONLY set, PR was approved but it will not be merged'
  )
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should review and merge', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      },
    },
    inputs: { 'pr-number': PR_NUMBER, target: 'any' },
  })

  await action()

  sinon.assert.calledWithExactly(
    stubs.logStub.logInfo,
    'Dependabot merge completed'
  )
  sinon.assert.calledOnce(stubs.approveStub)
  sinon.assert.calledOnce(stubs.mergeStub)
})

tap.test(
  'should merge github-action-merge-dependabot minor release',
  async () => {
    const PR_NUMBER = Math.random()
    const { action, stubs } = buildStubbedAction({
      payload: {
        pull_request: {
          number: PR_NUMBER,
          user: { login: BOT_NAME },
        },
      },
      inputs: { 'pr-number': PR_NUMBER, target: 'any' },
    })

    await action()

    sinon.assert.calledWithExactly(
      stubs.logStub.logInfo,
      'Dependabot merge completed'
    )
    sinon.assert.calledOnce(stubs.approveStub)
    sinon.assert.calledOnce(stubs.mergeStub)
  }
)

tap.test(
  'should not merge github-action-merge-dependabot major release',
  async () => {
    const PR_NUMBER = Math.random()
    const { action, stubs } = buildStubbedAction({
      payload: {
        pull_request: {
          number: PR_NUMBER,
          user: { login: BOT_NAME },
        },
      },
      inputs: { 'pr-number': PR_NUMBER, target: 'any' },
      dependabotMetadata: {
        updateType: updateTypes.major,
        dependencyNames: 'github-action-merge-dependabot',
      },
    })

    await action()

    sinon.assert.calledOnce(stubs.coreStub.setFailed)
    sinon.assert.notCalled(stubs.approveStub)
    sinon.assert.notCalled(stubs.mergeStub)
  }
)

tap.test('should review and merge', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      },
    },
    inputs: { 'pr-number': PR_NUMBER, target: 'any' },
  })

  await action()

  sinon.assert.calledWithExactly(
    stubs.logStub.logInfo,
    'Dependabot merge completed'
  )
  sinon.assert.notCalled(stubs.coreStub.setFailed)
  sinon.assert.calledOnce(stubs.approveStub)
  sinon.assert.calledOnce(stubs.mergeStub)
})

tap.test('should review and enable github auto-merge', async () => {
  const PR_NUMBER = Math.random()
  const PR_NODE_ID = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        node_id: PR_NODE_ID,
        user: { login: BOT_NAME },
      },
    },
    inputs: {
      'pr-number': PR_NUMBER,
      target: 'any',
      'use-github-auto-merge': true,
    },
  })

  await action()

  sinon.assert.calledWithExactly(
    stubs.logStub.logInfo,
    'USE_GITHUB_AUTO_MERGE set, PR was marked as auto-merge'
  )
  sinon.assert.notCalled(stubs.coreStub.setFailed)
  sinon.assert.calledOnce(stubs.approveStub)
  sinon.assert.calledOnce(stubs.enableAutoMergeStub)
})

tap.test('should forbid major when target is minor', async () => {
  const PR_NUMBER = Math.random()

  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      },
    },
    inputs: {
      PR_NUMBER,
      target: 'minor',
      exclude: 'react',
    },
    dependabotMetadata: createDependabotMetadata({
      updateType: updateTypes.major,
    }),
  })

  await action()

  sinon.assert.called(stubs.coreStub.setFailed)
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should forbid minor when target is patch', async () => {
  const PR_NUMBER = Math.random()

  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      },
    },
    inputs: {
      PR_NUMBER,
      target: 'patch',
      exclude: 'react',
    },
    dependabotMetadata: createDependabotMetadata({
      updateType: updateTypes.minor,
    }),
  })

  await action()

  sinon.assert.called(stubs.coreStub.setFailed)
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should forbid minor when target is patch', async () => {
  const PR_NUMBER = Math.random()

  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      },
    },
    inputs: {
      PR_NUMBER,
      target: 'patch',
      exclude: 'react',
    },
    dependabotMetadata: createDependabotMetadata({
      updateType: updateTypes.minor,
    }),
  })

  await action()

  sinon.assert.called(stubs.coreStub.setFailed)
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})
