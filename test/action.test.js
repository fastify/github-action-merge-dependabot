'use strict'

const tap = require('tap')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

// Stubbing modules
const core = require('@actions/core')
const github = require('@actions/github')
const toolkit = require('actions-toolkit')

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

  const prStub = sinon.stub();
  const approveStub = sinon.stub();
  const mergeStub = sinon.stub();
  const clientStub = sinon.stub(actionGithubClient, 'githubClient')
    .returns({
      getPullRequest: prStub.resolves(),
      approvePullRequest: approveStub.resolves(),
      mergePullRequest: mergeStub.resolves()
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
        title: 'bump foo from 3.18.0 to 4.0.0'
      }
    },
    inputs: { PR_NUMBER, TARGET: 'minor' }
  })

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
        head: { ref: 'dependabot/npm_and_yarn/foo-0.0.1' },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: ['foo'] }
  })

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logInfo, 'foo is excluded, skipping.')
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
    head: { ref: 'dependabot/npm_and_yarn/foo-0.0.1' },
  })

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
        head: { ref: 'dependabot/npm_and_yarn/foo-0.0.1' },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [] }
  })

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
        title: 'chore(deps): bump fastify/github-action-merge-dependabot from 2.5.0 to 2.6.0',
        user: { login: BOT_NAME },
        head: { ref: 'dependabot/github_actions/fastify/github-action-merge-dependabot-2.6.0' },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [], }
  })

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
        title: 'chore(deps): bump fastify/github-action-merge-dependabot from 2.5.0 to 3.6.0',
        user: { login: BOT_NAME },
        head: { ref: 'dependabot/github_actions/fastify/github-action-merge-dependabot-3.6.0' },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [], }
  })

  await action()

  sinon.assert.calledOnce(stubs.coreStub.setFailed)
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})

tap.test('should not merge github-action-merge-dependabot major release with semver-like title', async t => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        title: 'Bump fastify/github-action-merge-dependabot from 2.7.1 to 3',
        user: { login: BOT_NAME },
        head: { ref: 'dependabot/github_actions/fastify/github-action-merge-dependabot-3' },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [], }
  })

  await action()

  sinon.assert.calledOnce(stubs.coreStub.setFailed)
  t.match(stubs.coreStub.setFailed.firstCall.args[0], /^Cannot automerge github-action-merge-dependabot 3 major release./)
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
        head: { ref: 'dependabot/npm_and_yarn/foo-0.0.1' },
      }
    },
    inputs: { PR_NUMBER, TARGET: 'any', EXCLUDE_PKGS: [] }
  })

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
        title: 'Bump dotbot from `aa93350` to `ac5793c`',
        user: { login: BOT_NAME },
        head: { ref: 'dependabot/submodules/dotbot-ac5793c' },
      }
    },
    inputs: {
      PR_NUMBER,
      TARGET: 'minor',
      EXCLUDE_PKGS: [],
    }
  })

  await action()

  sinon.assert.calledWithExactly(stubs.logStub.logWarning, 'Target specified does not match to PR, skipping.')
  sinon.assert.notCalled(stubs.approveStub)
  sinon.assert.notCalled(stubs.mergeStub)
})
