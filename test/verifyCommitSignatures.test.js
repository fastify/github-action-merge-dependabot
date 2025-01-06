'use strict'

const tap = require('tap')

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

tap.test('verifyCommitSignatureCommitterAndAuthor', async t => {
  t.test('shoud throw error when', async t => {
    t.test('the verified flag is set to false', async t => {
      const {
        commit: {
          author,
          committer,
          verification: { verified },
        },
        sha,
      } = ValidAuthorValidCommitterUnverifiedCommitMock
      t.throws(
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

    t.test('the committer name is not GitHub', async t => {
      const {
        commit: {
          author,
          committer,
          verification: { verified },
        },
        sha,
      } = ValidAuthorInvalidCommitterVerifiedCommitMock
      t.throws(
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

    t.test('the authot name is not dependabot[bot]', async t => {
      const {
        commit: {
          author,
          committer,
          verification: { verified },
        },
        sha,
      } = InvalidAuthorValidCommitterVerifiedCommitMock
      t.throws(
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

    t.test(
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
        t.throws(
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

  t.test('should not throw an error when', async t => {
    t.test(
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
        t.doesNotThrow(
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

tap.test('VerifyCommits', async t => {
  t.test('Should throw error when', async t => {
    t.test('At least one commit does not match the requirements', async t => {
      t.throws(
        () => verifyCommits(prCommitsValidAndInvalid),
        new Error(
          'Signature for commit sha could not be verified - Not a dependabot commit'
        )
      )
    })

    t.test('At least one commit does not match the requirements', async t => {
      t.throws(
        () => verifyCommits(prCommitsInvalid),
        new Error(
          'Signature for commit sha could not be verified - Not a dependabot commit'
        )
      )
    })
  })
  t.test('Should not throw error when', async t => {
    t.test('All commits match the requirements', async t => {
      t.doesNotThrow(() => verifyCommits(prCommitsValid), {})
    })
  })
})
