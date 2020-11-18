const core = require('@actions/core')
const github = require('@actions/github')

const { logInfo } = require('./log')
const { getInputs } = require('./util')

const { GITHUB_TOKEN, MERGE_METHOD, EXCLUDE_PKGS } = getInputs()

async function run () {
  try {
    const octokit = github.getOctokit(GITHUB_TOKEN)

    const { repository, pull_request: pr } = github.context.payload
    const owner = repository.owner.login
    const repo = repository.name
    const prNumber = pr.number

    const isDependabotPR = pr.user.login === 'dependabot[bot]'

    if (!isDependabotPR) {
      return logInfo('Not dependabot PR, skip merging.')
    }

    // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
    const pkgName = pr.head.ref.split('/').pop().split('-').shift()

    if (EXCLUDE_PKGS.includes(pkgName)) {
      return logInfo(`${pkgName} is excluded, skip merging.`)
    }

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: 'APPROVE'
    })

    await octokit.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: MERGE_METHOD
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
