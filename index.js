const core = require('@actions/core')
const github = require('@actions/github')

const GITHUB_TOKEN = core.getInput('github-token', { required: true })
const EXCLUDE_PKGS = core.getInput('exclude') || []

const getMergeMethod = (repo) => {
  if (repo.allow_merge_commit) return 'merge'
  if (repo.allow_squash_merge) return 'squash'
  return 'rebase'
}

async function run () {
  try {
    const octokit = github.getOctokit(GITHUB_TOKEN)

    const { repository, pull_request: pr } = github.context.payload
    const owner = repository.owner.login
    const repo = repository.name
    const prNumber = pr.number

    const isDependabotPR = pr.user.login === 'dependabot[bot]'

    if (!isDependabotPR) {
      return core.info('Not dependabot PR, skip merging.')
    }

    // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
    const pkgName = pr.head.ref.split('/').pop().split('-').shift()

    if (EXCLUDE_PKGS.includes(pkgName)) {
      return core.info(`${pkgName} is excluded, skip merging.`)
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
      merge_method: getMergeMethod(pr.head.repo)
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
