# Github Action Merge Dependabot

This action automatically approves and merges dependabot PRs.


## Inputs

### `github-token`

**Required** A GitHub token. See below for additional information.

### `exclude`

_Optional_ An comma separated value of packages that you don't want to auto-merge and would like to manually review to decide whether to upgrade or not.

### `approve-only`

_Optional_ If `true`, the PR is only approved but not merged. Defaults to `false`.

### `merge-method`

_Optional_ The merge method you would like to use (squash, merge, rebase). Default to `squash` merge.

### `merge-comment`

_Optional_ An arbitrary message that you'd like to comment on the PR after it gets auto-merged. This is only useful when you're recieving too much of noise in email and would like to filter mails for PRs that got automatically merged.

### `target`

_Optional_ A flag to only auto-merge updates based on Semantic Versioning. Default to `major` merge. Possible options are:

`major, premajor, minor, preminor, patch, prepatch, prerelease or any`. Defaults to `any`.

For more details on how semantic version difference calculated please see [semver](https://www.npmjs.com/package/semver) package

### `pr-number`

_Optional_ A pull request number, only required if triggered from a workflow_dispatch event. Typically this would be triggered by a script running in a seperate CI provider. See [Trigger action from workflow_dispatch event](#trigger-action-from-workflow_dispatch-event)

## Usage

Configure this action in your workflows providing the inputs described above.
Note that this action requires a GitHub token with additional permissions. You must use the [`permissions`](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#permissions) tag to specify the required rules or configure your [GitHub account](https://github.blog/changelog/2021-04-20-github-actions-control-permissions-for-github_token/).

The permissions required are:

- [`pull-requests`](https://docs.github.com/en/rest/reference/permissions-required-for-github-apps#permission-on-pull-requests) permission: it is needed to approve PRs.
- [`contents`](https://docs.github.com/en/rest/reference/permissions-required-for-github-apps#permission-on-contents) permission: it is necessary to merge the pull request. You don't need it if you set `approve-only: true`, see the example below.

      

### Basic example

```yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # ...

  automerge:
    needs: build
    runs-on: ubuntu-latest

    permissions:
      pull-requests: write
      contents: write

    steps:
      - uses: fastify/github-action-merge-dependabot@v2.1.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Excluding packages

```yml
steps:
  - uses: fastify/github-action-merge-dependabot@v2.1.1
    permissions:
      pull-requests: write
      contents: write
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      exclude: 'react,fastify'
```

### Approving without merging

```yml
steps:
  - uses: fastify/github-action-merge-dependabot@v2.1.1
    permissions:
      pull-requests: write
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      approve-only: true
```

### Trigger action from workflow_dispatch event

If you need to trigger this action manually, you can use the [`workflow_dispatch`](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#workflow_dispatch) event. A use case might be that your CI runs on a seperate provider, so you would like to run this action as a result of a successful CI run.

When using the `workflow_dispatch` approach, you will need to send the PR number as part of the input for this action:

```yml
name: automerge

on:
  workflow_dispatch:
    inputs:
      pr-number:
        required: true

jobs:
  automerge:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: write
    steps:
      - uses: fastify/github-action-merge-dependabot@v2.2.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          pr-number: ${{ github.event.inputs.pr-number }}
```

You can initiate a call to trigger this event via [API](https://docs.github.com/en/rest/reference/actions/#create-a-workflow-dispatch-event):

```bash
# Note: replace dynamic values with your relevant data
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token {token}" \
  https://api.github.com/repos/{owner}/{reponame}/actions/workflows/{workflow}/dispatches \
  -d '{"ref":"{ref}", "inputs":{ "pr-number": "{number}"}}'
```

## Notes

- A GitHub token is automatically provided by Github Actions, which can be accessed using `secrets.GITHUB_TOKEN` and supplied to the action as an input `github-token`.
- Only the [GitHub native Dependabot integration](https://docs.github.com/en/github/administering-a-repository/keeping-your-dependencies-updated-automatically) is supported, the old [Dependabot Preview app](https://github.com/marketplace/dependabot-preview) isn't.
- Make sure to use `needs: <jobs>` to delay the auto-merging until CI checks (test/build) are passed.
- If you want to use GitHub's [auto-merge](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/automatically-merging-a-pull-request) feature but still use this action to approve Pull Requests without merging, use `approve-only: true`.
