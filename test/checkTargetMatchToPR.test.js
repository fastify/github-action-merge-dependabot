'use strict'
const tap = require('tap')
const checkTargetMatchToPR = require('../src/lib/checkTargetMatchToPR')

tap.test('getTargetInput', t => {
  const getPatchPRTitle = () => 'chore(deps-dev): bump fastify from 3.18.0 to 3.18.1'
  const getMinorPRTitle = () => 'chore(deps-dev): bump fastify from 3.18.0 to 3.19.1'
  const getMajorPRTitle = () => 'chore(deps-dev): bump fastify from 3.18.0 to 4.18.1'
  t.test('should return true', t => {
    t.equal(checkTargetMatchToPR(), true, 'should return true when nothing is provided')
    t.equal(checkTargetMatchToPR(null),true,'should return true when input is null')
    t.equal(checkTargetMatchToPR(''),true,'should return true when empty input provided')

    t.equal(checkTargetMatchToPR(getPatchPRTitle()),true,'When PR is patch and no target is provided should return true')
    t.equal(checkTargetMatchToPR(getMinorPRTitle()),true,'When PR is minor and no target is provided should return true')
    t.equal(checkTargetMatchToPR(getMajorPRTitle()),true,'When PR is major and no target is provided should return true')

    t.equal(checkTargetMatchToPR(getPatchPRTitle(),'major'),true,'When PR is patch and target is major should return true')
    t.equal(checkTargetMatchToPR(getMinorPRTitle(),'major'),true,'When PR is minor and target is major  should return true')
    t.equal(checkTargetMatchToPR(getMajorPRTitle(),'major'),true,'When PR is major and target is major should return true')

    t.equal(checkTargetMatchToPR(getPatchPRTitle(),'minor'),true,'When PR is patch and target is minor should return true')
    t.equal(checkTargetMatchToPR(getMinorPRTitle(),'minor'),true,'When PR is minor and target is minor should return true')
    t.equal(checkTargetMatchToPR(getPatchPRTitle(),'patch'),true,'When PR is patch and target is patch should return true')
    t.end()

  })
  t.test('should return true', t => {
    t.equal(checkTargetMatchToPR(getMajorPRTitle(),'minor'),false,'When PR is major and target is minor should return false')
    t.equal(checkTargetMatchToPR(getMinorPRTitle(),'patch'),false,'When PR is minor and target is patch should return false')
    t.equal(checkTargetMatchToPR(getMajorPRTitle(),'patch'),false,'When PR is major and target is patch should return false')

    t.end()
  })
  t.end()

})
