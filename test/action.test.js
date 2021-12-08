'use strict'

const tap = require('tap')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

// Stubbing modules
const core = require('@actions/core')
const github = require('@actions/github')

const actionLog = require('../src/log')
const actionUtil = require('../src/util')

const GITHUB_TOKEN = 'the-token'
const BOT_NAME = 'dependabot[bot]'
const DEFAULT_API_URL = 'http://foo.bar'

function buildStubbedAction({
  payload,
  inputs
}) {

  const coreStub = sinon.stub(core)
  const githubStub = sinon.stub(github, 'context')
    .get(() => { return { payload } })

  const logStub = sinon.stub(actionLog)
  const utilStub = sinon.stub(actionUtil, 'getInputs')
    .returns({ GITHUB_TOKEN, ...inputs })

  const prStub = sinon.stub();
  const fetchStub = sinon.stub()

  const action = proxyquire('../src/action', {
    '@actions/core': coreStub,
    '@actions/github': githubStub,
    'node-fetch': fetchStub.resolves({
      ok: true,
      status: 200,
      async text() { return 'pr-text' },
    }),
    './getPullRequest': prStub.resolves(),
    './log': logStub,
    './util': utilStub
  })

  return {
    action,
    stubs: {
      coreStub,
      githubStub,
      logStub,
      utilStub,
      prStub,
      fetchStub
    }
  }

}

tap.afterEach(() => { sinon.restore() })

tap.test('should not run if a pull request number is missing', async t => {
  const { action, stubs } = buildStubbedAction({
    payload: { issue: {} }
  })
  await action()

  t.ok(stubs.logStub.logError.calledOnceWith('This action must be used in the context of a Pull Request or with a Pull Request number'))
  t.ok(stubs.fetchStub.notCalled)
})

tap.test('should retrieve PR info when trigger by non pull_request events', async t => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: { 'not a pull_request': {} },
    inputs: { PR_NUMBER }
  })

  await action()

  t.ok(stubs.prStub.calledOnce)
})

tap.test('should skip non-dependabot PR', async t => {
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

  t.ok(stubs.prStub.calledOnce)
  t.ok(stubs.logStub.logWarning.calledOnceWith('Not a dependabot PR, skipping.'))
  t.ok(stubs.fetchStub.notCalled)
})

tap.test('should process dependabot PR and skip PR not in target', async t => {
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

  t.ok(stubs.logStub.logWarning.calledOnceWith('Target specified does not match to PR, skipping.'))
  t.ok(stubs.fetchStub.notCalled)
})

tap.test('should ignore excluded package', async t => {
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

  t.ok(stubs.logStub.logInfo.calledOnceWith('foo is excluded, skipping.'))
  t.ok(stubs.fetchStub.notCalled)
})

tap.test('approve only should not merge', async t => {
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

  await action()

  t.ok(stubs.fetchStub.calledOnce)
})

tap.test('should review and merge', async t => {
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

  t.ok(stubs.logStub.logInfo.calledOnceWith('pr-text'))
  t.ok(stubs.fetchStub.calledOnce)
})

tap.test('should merge github-action-merge-dependabot minor release (custom API_URL)', async t => {
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
    inputs: {
      PR_NUMBER,
      TARGET: 'any',
      EXCLUDE_PKGS: [],
      API_URL: 'custom one',
      DEFAULT_API_URL,
    }
  })

  await action()

  t.ok(stubs.logStub.logInfo.calledOnceWith('pr-text'))
  t.ok(stubs.fetchStub.calledOnce)
})

tap.test('should not merge github-action-merge-dependabot major release (custom API_URL)', async t => {
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
    inputs: {
      PR_NUMBER,
      TARGET: 'any',
      EXCLUDE_PKGS: [],
      API_URL: 'custom one',
      DEFAULT_API_URL,
    }
  })

  await action()

  t.ok(stubs.logStub.logWarning.calledOnce)
  t.match(stubs.logStub.logWarning.getCalls()[0].firstArg, /Cannot automerge github-action-merge-dependabot 3.6.0/)
  t.ok(stubs.fetchStub.notCalled)
})

tap.test('should call external api for github-action-merge-dependabot major release', async t => {
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
    inputs: {
      PR_NUMBER,
      TARGET: 'any',
      EXCLUDE_PKGS: [],
      API_URL: DEFAULT_API_URL,
      DEFAULT_API_URL,
    }
  })

  stubs.fetchStub.resolves({
    ok: false,
    status: 422,
    async text() { return 'how to migrate' },
  }),

  await action()

  t.ok(stubs.logStub.logWarning.calledOnce)
  t.ok(stubs.fetchStub.calledOnce)
})

tap.test('should check submodules semver when target is set', async t => {
  const PR_NUMBER = Math.random()
  const { action, stubs } = buildStubbedAction({
    payload: {
      pull_request: {
        number: PR_NUMBER,
        title: 'Bump dotbot from aa93350 to ac5793c',
        user: { login: BOT_NAME },
        head: { ref: 'dependabot/submodules/dotbot-ac5793c' },
      }
    },
    inputs: {
      PR_NUMBER,
      TARGET: 'minor',
      EXCLUDE_PKGS: [],
      API_URL: 'custom one',
      DEFAULT_API_URL,
    }
  })

  await action()

  t.ok(stubs.logStub.logInfo.calledOnceWith('pr-text'))
  t.ok(stubs.fetchStub.calledOnce)
})
