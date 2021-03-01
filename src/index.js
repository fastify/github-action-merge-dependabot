const core = require('@actions/core')
const github = require('@actions/github')

const { logInfo } = require('./log')
const { getInputs } = require('./util')

const {
  GITHUB_TOKEN,
  MERGE_METHOD,
  EXCLUDE_PKGS,
  MERGE_COMMENT,
  APPROVE_ONLY,
} = getInputs()

async function run() {
  try {
    const octokit = github.getOctokit(GITHUB_TOKEN)

    const { repository, pull_request: pr } = github.context.payload

    if (!pr) {
      throw new Error(
        'This action must be used in the context of a Pull Request'
      )
    }

    const owner = repository.owner.login
    const repo = repository.name
    const prNumber = pr.number

    const isDependabotPR = pr.user.login === 'dependabot[bot]'

    if (!isDependabotPR) {
      return logInfo('Not dependabot PR, skipping.')
    }

    // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
    const pkgName = pr.head.ref.split('/').pop().split('-').shift()

    if (EXCLUDE_PKGS.includes(pkgName)) {
      return logInfo(`${pkgName} is excluded, skipping.`)
    }

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: 'APPROVE',
    })

    if (APPROVE_ONLY) {
      return logInfo('Approving only.')
    }

    await octokit.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: MERGE_METHOD,
    })

    if (MERGE_COMMENT) {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: MERGE_COMMENT,
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
