'use strict'

const tap = require('tap')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

// Stubbing modules
const core = require('@actions/core')
const github = require('@actions/github')
const toolkit = require('actions-toolkit')

const { diffs } = require('./moduleChanges')
const actionLog = require('../src/log')
const actionUtil = require('../src/util')
const actionGithubClient = require('../src/github-client')

const GITHUB_TOKEN = 'the-token'
const BOT_NAME = 'dependabot[bot]'

function buildStubbedAction({
  payload,
  inputs
}) {
  const coreStub = sinon.stub(core)
  const toolkitStub = sinon.stub(toolkit, 'logActionRefWarning')
    .get(() => sinon.stub())

  const githubStub = sinon.stub(github, 'context')
    .get(() => { return { payload } })

  const logStub = sinon.stub(actionLog)
  const utilStub = sinon.stub(actionUtil, 'getInputs')
    .returns({ GITHUB_TOKEN, ...inputs })

  const prStub = sinon.stub()
  const prDiffStub = sinon.stub()
  const approveStub = sinon.stub()
  const mergeStub = sinon.stub()
  const clientStub = sinon.stub(actionGithubClient, 'githubClient')
    .returns({
      getPullRequest: prStub.resolves(),
      approvePullRequest: approveStub.resolves(),
      mergePullRequest: mergeStub.resolves(),
      getPullRequestDiff: prDiffStub.resolves(),
    })

  const action = proxyquire('../src/action', {
    '@actions/core': coreStub,
    'actions-toolkit': toolkitStub,
    '@actions/github': githubStub,
    './log': logStub,
    './util': utilStub,
    './github-client': clientStub
  })

  return {
    action,
    stubs: {
      coreStub,
      githubStub,
      logStub,
      utilStub,
      prStub,
      approveStub,
      mergeStub,
      prDiffStub,
    }
  }
}

tap.afterEach(() => { sinon.restore() })

tap.test('should not run if a pull request number is missing', async () => {
  const { action, stubs } = buildStubbedAction({
    payload: { issue: {} }
  })
  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logError, 'This action must be used in the context of a Pull Request or with a Pull Request number')
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should retrieve PR info when trigger by non pull_request events', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: { 'not a pull_request': {} },
    inputs: { PR_NUMBER }
  })

  await action()

  sinon.assert.calledOnce(stubs.prStub)
})

tap.test('should skip non-dependabot PR', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: { issue: {} },
    inputs: { PR_NUMBER }
  })

  stubs.prStub.resolves({
    user: {
      login: 'not dependabot'
    }
  })

  await action()

  sinon.assert.calledOnce(stubs.prStub)
  sinon.assert.calledWithExactly(stubs.logStub.logWarning, 'Not a dependabot PR, skipping.')
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should process dependabot PR and skip PR not in target', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        user: {
          login: BOT_NAME
        },
        number: PR_NUMBER,
      }
    },
    inputs: { PR_NUMBER, TARGET: 'minor' }
  })

  stubs.prDiffStub.resolves(diffs.major)

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logWarning, 'Target specified does not match to PR, skipping.')
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should ignore excluded package', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: ['react'] }
  })

  stubs.prDiffStub.resolves(diffs.major)

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logInfo, '1 package(s) excluded: react. Skipping.')
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('approve only should not merge', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: { issue: {} },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [], APPROVE_ONLY: true }
  })

  stubs.prStub.resolves({
    number: PR_NUMBER,
    user: { login: BOT_NAME },
  })

  stubs.prDiffStub.resolves(diffs.major)

  stubs.approveStub.resolves({ data: true })

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logInfo, 'Approving only')
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should review and merge', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [] }
  })

  stubs.prDiffStub.resolves(diffs.major)

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logInfo, 'Dependabot merge completed')
  sinon.assert.calledOnce(stubs.approveStub)
  sinon.assert.calledOnce(stubs.mergeStub)
})

tap.test('should merge github-action-merge-dependabot minor release', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [], }
  })

  stubs.prDiffStub.resolves(diffs.thisModuleMinor)

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logInfo, 'Dependabot merge completed')
  sinon.assert.calledOnce(stubs.approveStub)
  sinon.assert.calledOnce(stubs.mergeStub)
})

tap.test('should not merge github-action-merge-dependabot major release', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [], }
  })

  stubs.prDiffStub.resolves(diffs.thisModuleMajor)

  await action()

  sinon.assert.calledOnce(stubs.coreStub.setFailed)
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should review and merge', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [] }
  })

  stubs.prDiffStub.resolves(diffs.major)

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logInfo, 'Dependabot merge completed')
  sinon.assert.calledOnce(stubs.approveStub)
  sinon.assert.calledOnce(stubs.mergeStub)
})

tap.test('should check submodules semver when target is set', async () => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
      }
    },
    inputs: {
      PR_NUMBER,
      TARGET: 'minor',
      EXCLUDE_PKGS: [],
    }
  })

  stubs.prDiffStub.resolves(diffs.submodules)

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logWarning, 'Target specified does not match to PR, skipping.')
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should merge major bump using PR title', async () => {
  const PR_NUMBER = Math.random()

  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
        title: 'build(deps): bump actions/checkout from 2 to 3',
        head: {
          ref: 'dependabot/github_actions/actions/checkout-3'
        }
      }
    },
    inputs: {
      PR_NUMBER,
      TARGET: 'major',
      EXCLUDE_PKGS: ['react'],
    }
  })

  stubs.prDiffStub.resolves(diffs.noPackageJsonChanges)

  await action()

  sinon.assert.called(stubs.approveStub)
  sinon.assert.called(stubs.mergeStub)
})

tap.test('should forbid major bump using PR title', async () => {
  const PR_NUMBER = Math.random()

  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
        title: 'build(deps): bump actions/checkout from 2 to 3',
        head: {
          ref: 'dependabot/github_actions/actions/cache-3'
        }
      }
    },
    inputs: {
      PR_NUMBER,
      TARGET: 'minor',
      EXCLUDE_PKGS: ['react'],
    }
  })

  stubs.prDiffStub.resolves(diffs.noPackageJsonChanges)

  await action()

  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})


tap.test('should not merge major bump if updating github-action-merge-dependabot', async () => {
  const PR_NUMBER = Math.random()

  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
        title: 'build(deps): bump github-action-merge-dependabot from 2 to 3 zzz',
        head: {
          ref: 'dependabot/github_actions/fastify/github-action-merge-dependabot-3'
        }
      }
    },
    inputs: {
      PR_NUMBER,
      TARGET: 'any',
      EXCLUDE_PKGS: ['react'],
    }
  })

  stubs.prDiffStub.resolves(diffs.noPackageJsonChanges)

  await action()

  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should throw if the PR title is not valid', async () => {
  const PR_NUMBER = Math.random()

  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        user: { login: BOT_NAME },
        title: 'Invalid PR title',
        head: {
          ref: 'dependabot/github_actions/fastify/github-action-merge-dependabot-2.6.0'
        }
      }
    },
    inputs: {
      PR_NUMBER,
      TARGET: 'major',
      EXCLUDE_PKGS: ['react'],
    }
  })

  stubs.prDiffStub.resolves(diffs.noPackageJsonChanges)

  await action()

  sinon.assert.calledWith(stubs.coreStub.setFailed, ("Error while parsing PR title, expected: `bump <package> from <old-version> to <new-version>`"))
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})
