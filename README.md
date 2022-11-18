# Github Action Merge Dependabot

This action automatically approves and merges dependabot PRs.


## Inputs

### `github-token`

_Optional_ A GitHub token. See below for additional information.

### `exclude`

_Optional_ A comma or semicolon separated value of packages that you don't want to auto-merge and would like to manually review to decide whether to upgrade or not.

### `approve-only`

_Optional_ If `true`, the PR is only approved but not merged. Defaults to `false`.

### `merge-method`

_Optional_ The merge method you would like to use (squash, merge, rebase). Default to `squash` merge.

### `merge-comment`

_Optional_ An arbitrary message that you'd like to comment on the PR after it gets auto-merged. This is only useful when you're recieving too much of noise in email and would like to filter mails for PRs that got automatically merged.

### `use-github-auto-merge`

_Optional_ If `true`, the PR is marked as auto-merge and will be merged by GitHub when status checks are satisfied. Default to `false`.

_NOTE_ This feature only works when all of the following conditions are met.

- The repository enables auto-merge.
- The pull request base must have a branch protection rule.
- The pull request's status checks are not yet satisfied.

Refer to [the official document](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request) about GitHub auto-merge.

### `target`

_Optional_ A flag to only auto-merge updates based on Semantic Versioning. Defaults to `any`.

Possible options are:

`major, premajor, minor, preminor, patch, prepatch, prerelease, any`.

For more details on how semantic version difference is calculated please see [semver](https://www.npmjs.com/package/semver) package.

If you set a value other than `any`, PRs that are not semantic version compliant are skipped.
An example of a non-semantic version is a commit hash when using git submodules.

### `pr-number`

_Optional_ A pull request number, only required if triggered from a workflow_dispatch event. Typically this would be triggered by a script running in a seperate CI provider. See [Trigger action from workflow_dispatch event](#trigger-action-from-workflow_dispatch-event)

### `compatibility-score`

_Optional_ A minimum [Compatibility score](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates#about-compatibility-scores) needed for the PR to be merged.

## Usage

Configure this action in your workflows providing the inputs described above.
Note that this action requires a GitHub token with additional permissions. You must use the [`permissions`](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#permissions) tag to specify the required rules or configure your [GitHub account](https://github.blog/changelog/2021-04-20-github-actions-control-permissions-for-github_token/).

The permissions required are:

- [`pull-requests`](https://docs.github.com/en/rest/reference/permissions-required-for-github-apps#permission-on-pull-requests) permission: it is needed to approve PRs.
- [`contents`](https://docs.github.com/en/rest/reference/permissions-required-for-github-apps#permission-on-contents) permission: it is necessary to merge the pull request. You don't need it if you set `approve-only: true`, see the example below.

If some of the required permissions are missing, the action will fail with the error message:

```
Error: Resource not accessible by integration
```

### Basic example

```yml
name: CI
on:
  push:
    branches:
      - main
  pull_request:

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
      - uses: fastify/github-action-merge-dependabot@v3
```

### Excluding packages

```yml
permissions:
  pull-requests: write
  contents: write

steps:
  - uses: fastify/github-action-merge-dependabot@v3
    with:
      exclude: 'react,fastify'
```

### Approving without merging

```yml
permissions:
  pull-requests: write
steps:
  - uses: fastify/github-action-merge-dependabot@v3
    with:
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
      - uses: fastify/github-action-merge-dependabot@v3
        with:
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


## How to upgrade from `2.x` to new `3.x`

- Update the action version.
- Add the new `permissions` configuration into your workflow or, instead, you can set the permissions rules on [the repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#setting-the-permissions-of-the-github_token-for-your-repository) or on [the organization](https://docs.github.com/en/enterprise-server@3.3/admin/policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#enforcing-a-policy-for-workflow-permissions-in-your-enterprise).
- Uninstall the [dependabot-merge-action](https://github.com/apps/dependabot-merge-action) GitHub App from your repos/orgs.
- If you have customized the `api-url` you can:
  - Remove the `api-url` option from your workflow.
  - Turn off the [`dependabot-merge-action-app`](https://github.com/fastify/dependabot-merge-action-app/) application.


Migration example:

```diff
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # ...

  automerge:
    needs: build
    runs-on: ubuntu-latest
+    permissions:
+      pull-requests: write
+      contents: write
    steps:
-     - uses: fastify/github-action-merge-dependabot@v2.1.1
+     - uses: fastify/github-action-merge-dependabot@v3
```

## Notes

- A GitHub token is automatically provided by Github Actions, which can be accessed using `github.token` and supplied to the action as an input `github-token`.
- Only the [GitHub native Dependabot integration](https://docs.github.com/en/github/administering-a-repository/keeping-your-dependencies-updated-automatically) is supported, the old [Dependabot Preview app](https://github.com/marketplace/dependabot-preview) isn't.
- Make sure to use `needs: <jobs>` to delay the auto-merging until CI checks (test/build) are passed.
- If you want to use GitHub's [auto-merge](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/automatically-merging-a-pull-request) feature but still use this action to approve Pull Requests without merging, use `approve-only: true`.

## Acknowledgements

This project is kindly sponsored by [NearForm](https://nearform.com)
