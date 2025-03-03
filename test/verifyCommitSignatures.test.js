'use strict'

const { test } = require('node:test')

const {
  dependabotAuthor,
  dependabotCommitter,
} = require('../src/getDependabotDetails')
const {
  verifyCommits,
  verifyCommitSignatureCommitterAndAuthor,
} = require('../src/verifyCommitSignatures')

const ValidAuthorValidCommitterVerifiedCommitMock = {
  commit: {
    author: { name: dependabotAuthor },
    committer: { name: dependabotCommitter },
    verification: { verified: true },
  },
  sha: 'sha',
}
const ValidAuthorValidCommitterUnverifiedCommitMock = {
  commit: {
    author: { name: dependabotAuthor },
    committer: { name: dependabotCommitter },
    verification: { verified: false },
  },
  sha: 'sha',
}
const InvalidAuthorValidCommitterVerifiedCommitMock = {
  commit: {
    author: { name: 'testUser' },
    committer: { name: dependabotCommitter },
    verification: { verified: true },
  },
  sha: 'sha',
}
const ValidAuthorInvalidCommitterVerifiedCommitMock = {
  commit: {
    author: { name: dependabotAuthor },
    committer: { name: 'testUser' },
    verification: { verified: true },
  },
  sha: 'sha',
}
const InvalidAuthorInvalidCommitterUnverifiedCommitMock = {
  commit: {
    author: { name: 'testUser' },
    committer: { name: 'testUser' },
    verification: { verified: false },
  },
  sha: 'sha',
}

const prCommitsValid = [
  ValidAuthorValidCommitterVerifiedCommitMock,
  ValidAuthorValidCommitterVerifiedCommitMock,
]
const prCommitsInvalid = [
  InvalidAuthorValidCommitterVerifiedCommitMock,
  InvalidAuthorValidCommitterVerifiedCommitMock,
]
const prCommitsValidAndInvalid = [
  ValidAuthorValidCommitterVerifiedCommitMock,
  InvalidAuthorValidCommitterVerifiedCommitMock,
]

test('verifyCommitSignatureCommitterAndAuthor', async t => {
  await t.test('shoud throw error when', async t => {
    await t.test('the verified flag is set to false', async t => {
      const {
        commit: {
          author,
          committer,
          verification: { verified },
        },
        sha,
      } = ValidAuthorValidCommitterUnverifiedCommitMock
      t.assert.throws(
        () =>
          verifyCommitSignatureCommitterAndAuthor(
            sha,
            author,
            committer,
            verified
          ),
        new Error(
          `Signature for commit ${sha} could not be verified - Not a dependabot commit`
        )
      )
    })

    await t.test('the committer name is not GitHub', async t => {
      const {
        commit: {
          author,
          committer,
          verification: { verified },
        },
        sha,
      } = ValidAuthorInvalidCommitterVerifiedCommitMock
      t.assert.throws(
        () =>
          verifyCommitSignatureCommitterAndAuthor(
            sha,
            author,
            committer,
            verified
          ),
        new Error(
          `Signature for commit ${sha} could not be verified - Not a dependabot commit`
        )
      )
    })

    await t.test('the authot name is not dependabot[bot]', async t => {
      const {
        commit: {
          author,
          committer,
          verification: { verified },
        },
        sha,
      } = InvalidAuthorValidCommitterVerifiedCommitMock
      t.assert.throws(
        () =>
          verifyCommitSignatureCommitterAndAuthor(
            sha,
            author,
            committer,
            verified
          ),
        new Error(
          `Signature for commit ${sha} could not be verified - Not a dependabot commit`
        )
      )
    })

    await t.test(
      'the committer name is not Github, the author is not dependabot[bot] and is not verified',
      async t => {
        const {
          commit: {
            author,
            committer,
            verification: { verified },
          },
          sha,
        } = InvalidAuthorInvalidCommitterUnverifiedCommitMock
        t.assert.throws(
          () =>
            verifyCommitSignatureCommitterAndAuthor(
              sha,
              author,
              committer,
              verified
            ),
          new Error(
            `Signature for commit ${sha} could not be verified - Not a dependabot commit`
          )
        )
      }
    )
  })

  await t.test('should not throw an error when', async t => {
    await t.test(
      'the committer name is Github, the author is dependabot[bot] and is verified',
      async t => {
        const {
          commit: {
            author,
            committer,
            verification: { verified },
          },
          sha,
        } = ValidAuthorValidCommitterVerifiedCommitMock
        t.assert.doesNotThrow(
          () =>
            verifyCommitSignatureCommitterAndAuthor(
              sha,
              author,
              committer,
              verified
            ),
          {}
        )
      }
    )
  })
})

test('VerifyCommits', async t => {
  await t.test('Should throw error when', async t => {
    await t.test('At least one commit does not match the requirements', async t => {
      t.assert.throws(
        () => verifyCommits(prCommitsValidAndInvalid),
        new Error(
          'Signature for commit sha could not be verified - Not a dependabot commit'
        )
      )
    })

    await t.test('At least one commit does not match the requirements', async t => {
      t.assert.throws(
        () => verifyCommits(prCommitsInvalid),
        new Error(
          'Signature for commit sha could not be verified - Not a dependabot commit'
        )
      )
    })
  })
  await t.test('Should not throw error when', async t => {
    await t.test('All commits match the requirements', async t => {
      t.assert.doesNotThrow(() => verifyCommits(prCommitsValid), {})
    })
  })
})
