# Github Action Merge Dependabot

This action automatically approves and merges dependabot PRs.

## Inputs

### `github-token`

**Required** A GitHub token. See below for additional information.

### `exclude`

_Optional_ An array of packages that you don't want to auto-merge and would like to manually review to decide whether to upgrade or not.

### `approve-only`

_Optional_ If `true`, the PR is only approved but not merged. Defaults to `false`.

### `merge-method`

_Optional_ The merge method you would like to use (squash, merge, rebase). Default to `squash` merge.

### `merge-comment`

_Optional_ An arbitrary message that you'd like to comment on the PR after it gets auto-merged. This is only useful when you're recieving too much of noise in email and would like to filter mails for PRs that got automatically merged.

## Example usage

### Basic example

```yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps: # ...

  automerge:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: fastify/github-action-merge-dependabot@v1
        if: ${{ github.actor == 'dependabot[bot]' && github.event_name == 'pull_request' }}
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
```

### With `exclude`

```yml
steps:
  - uses: fastify/github-action-merge-dependabot@v1
    if: ${{ github.actor == 'dependabot[bot]' && github.event_name == 'pull_request' }}
    with:
      github-token: ${{secrets.github_token}}
      exclude: ['react']
```

## Notes

- A GitHub token is automatically provided by Github Actions, which can be accessed using `secrets.GITHUB_TOKEN` and supplied to the action as an input `github-token`.
- Only the [GitHub native Dependabot integration](https://docs.github.com/en/github/administering-a-repository/keeping-your-dependencies-updated-automatically) is supported, the old [Dependabot Preview app](https://github.com/marketplace/dependabot-preview) isn't.
- This action must be used in the context of a Pull Request. If the workflow can be triggered by other events (e.g. push), make sure to include `github.event_name == 'pull_request'` in the action conditions, as shown in the example.
- Make sure to use `needs: <jobs>` to delay the auto-merging until CI checks (test/build) are passed.
- If you want to use GitHub's [auto-merge](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/automatically-merging-a-pull-request) feature but still use this action to approve Pull Requests without merging, use `approve-only: true`.

## Limitations

One known limitation of using a GitHub action with the built-in GitHub Token to automatically merge Pull Requests is that the result of the merge will not trigger a workflow run.

What this means in practice is that after this action merges a Pull Request, no workflows are run on the commit made to the target branch.

This is a known behavior described in the [documentation](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#triggering-new-workflows-using-a-personal-access-token) which prevents triggering of recursive workflow runs.

Alternative options are:

- use a personal access token, as described in the documentation
- use this action only for approving and using GitHub's auto-merge to merge Pull Requests
