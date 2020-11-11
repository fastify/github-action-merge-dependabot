# Github Action Merge Dependabot

This action automatically merges dependabot PRs.

## Inputs

### `github-token`

**Required** A github token.

## Example usage

```yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      ...

  automerge:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: salmanm/github-action-merge-dependabot@v1
        if: ${{ github.actor == 'dependabot[bot]' && github.event_name == 'pull_request' }}
        with:
          github-token: ${{secrets.github_token}}
```
