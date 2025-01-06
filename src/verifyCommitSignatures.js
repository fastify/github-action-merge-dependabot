'use strict'

const {
  dependabotAuthor,
  dependabotCommitter,
} = require('./getDependabotDetails')

function verifyCommits (commits) {
  commits.forEach(function (commit) {
    const {
      commit: {
        verification: { verified },
        committer,
        author,
      },
      sha,
    } = commit
    verifyCommitSignatureCommitterAndAuthor(sha, author, committer, verified)
  })
}

function verifyCommitSignatureCommitterAndAuthor (
  sha,
  author,
  committer,
  verified
) {
  if (
    !verified ||
    committer.name !== dependabotCommitter ||
    author.name !== dependabotAuthor
  ) {
    throw new Error(
      `Signature for commit ${sha} could not be verified - Not a dependabot commit`
    )
  }
}

module.exports = {
  verifyCommits,
  verifyCommitSignatureCommitterAndAuthor,
}
