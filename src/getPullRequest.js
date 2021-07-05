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
  console.log(response)
  const data = await response.json()
  console.log(data)

  return data
}

module.exports = getPullRequest
