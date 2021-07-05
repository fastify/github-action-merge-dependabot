'use strict'

const fetch = require('node-fetch')

const { getInputs } = require('./util')

const { GITHUB_TOKEN } = getInputs()

const getPullRequest = async url => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `token ${GITHUB_TOKEN}`,
      accept: 'application/vnd.github.v3+json',
    },
  })

  const data = await response.json()

  return data
}

module.exports = getPullRequest
