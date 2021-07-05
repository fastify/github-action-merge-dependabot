'use strict'

const fetch = require('node-fetch')

const { getInputs } = require('./util')

const { GITHUB_TOKEN } = getInputs()

const getPullRequest = async url => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `token ${GITHUB_TOKEN}`,
      'content-type': 'application/vnd.github.v3+json',
    },
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(
      `Request failed with status code ${response.status}: ${responseText}`
    )
  }

  return response
}

module.exports = getPullRequest
