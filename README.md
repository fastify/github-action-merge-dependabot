# Github Action Merge Dependabot

This action automatically approves and merges dependabot PRs.

## Usage

- **install the [GitHub App](https://github.com/apps/dependabot-merge-action) on the repositories or organization where you want to use this action.** Using a GitHub App is necessary since [this change](https://github.blog/changelog/2021-02-19-github-actions-workflows-triggered-by-dependabot-prs-will-run-with-read-only-permissions/) GitHub introduced which limits the permissions of the provided GITHUB_TOKEN and the availability of secrets in Dependabot pull requests. The source [code of the GitHub App](https://github.com/fastify/dependabot-merge-action-app/) is open source and hosted on Google Cloud Platform. You can also host your own version of the app and customize the `api-url` input to point to your hosted instance.
- configure this action in your workflows providing the inputs described below

## Inputs

### `github-token`

**Required** A GitHub token. See below for additional information.

### `exclude`

_Optional_ A comma separated value of packages that you don't want to auto-merge and would like to manually review to decide whether to upgrade or not.

### `approve-only`

_Optional_ If `true`, the PR is only approved but not merged. Defaults to `false`.

### `merge-method`

_Optional_ The merge method you would like to use (squash, merge, rebase). Default to `squash` merge.

### `merge-comment`

_Optional_ An arbitrary message that you'd like to comment on the PR after it gets auto-merged. This is only useful when you're recieving too much of noise in email and would like to filter mails for PRs that got automatically merged.

### `api-url`

_Optional_ A custom url where the external API which is delegated the task of approving and merging responds.

### `target`

_Optional_ A flag to only auto-merge updates based on Semantic Versioning. Defaults to `any`.

Possible options are:

`major, premajor, minor, preminor, patch, prepatch, prerelease, any`.

For more details on how semantic version difference is calculated please see [semver](https://www.npmjs.com/package/semver) package.

If you set a value other than `any`, PRs that are not semantic version compliant are skipped.
An example of a non-semantic version is a commit hash.

### `pr-number`

_Optional_ A pull request number, only required if triggered from a workflow_dispatch event. Typically this would be triggered by a script running in a seperate CI provider. See [Trigger action from workflow_dispatch event](#trigger-action-from-workflow_dispatch-event)

## Example usage

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
    steps:
      - uses: fastify/github-action-merge-dependabot@v2.1.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Excluding packages

```yml
steps:
  - uses: fastify/github-action-merge-dependabot@v2.1.1
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      exclude: 'react,fastify'
```

### Approving without merging

```yml
steps:
  - uses: fastify/github-action-merge-dependabot@v2.1.1
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      approve-only: true
```

### Trigger action from workflow_dispatch event

If you need to trigger this action manually, you can use the [workflow_dispatch](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#workflow_dispatch) event. A use case might be that your CI runs on a seperate provider, so you would like to run this action as a result of a successful CI run.

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

## Acknowledgements

This project is kindly sponsored by [NearForm](https://nearform.com)
