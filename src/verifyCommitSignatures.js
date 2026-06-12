import {
  dependabotAuthor,
  dependabotCommitter,
} from './getDependabotDetails.js'

export function verifyCommits (commits) {
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

export function verifyCommitSignatureCommitterAndAuthor (
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
