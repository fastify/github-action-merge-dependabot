'use strict'
const tap = require('tap')

const checkTargetMatchToPR = require('../src/checkTargetMatchToPR')
const { targetOptions } = require('../src/getTargetInput')

const patchPRTitle = 'chore(deps-dev): bump fastify from 3.18.0 to 3.18.1'
const prePatchPRTitle = 'chore(deps-dev): bump fastify from 1.1.1-foo to 1.1.2'
const preMajorPRTitle = 'chore(deps-dev): bump fastify from 1.2.3 to 2.0.0-pre'
const preMinorPRTitle = 'chore(deps-dev): bump fastify from 0.0.1-foo to 0.1.0'
const minorPRTitle = 'chore(deps-dev): bump fastify from 3.18.0 to 3.19.1'
const majorPRTitle = 'chore(deps-dev): bump fastify from 3.18.0 to 4.18.1'
const majorPRTitleWithMultipleFroms =
  'chore(deps-dev): bump from fastify from 3.18.0 to 4.18.1'
const preReleaseUpgradePRTitle =
  'chore(deps-dev): bump fastify from 3.18.0-alpha to 3.18.1-beta'
const preReleaseToPathUpgradePRTitle =
  'chore(deps-dev): bump fastify from 3.18.0-alpha to 3.18.2'
const sameVersion = 'chore(deps-dev): bump fastify from 3.18.0 to 3.18.0'
const patchPRTitleInSubDirectory = 'chore(deps-dev): bump fastify from 3.18.0 to 3.18.1 in /packages/a'
const semverLikeMinor = 'chore(deps): bump nearform/optic-release-automation-action from 2.2.0 to 2.3'
const semverLikeMajor = 'chore(deps): bump nearform/optic-release-automation-action from 2.2.0 to 3'
const semverLikeBothWay = 'chore(deps): bump nearform/optic-release-automation-action from 2 to 3'
const submodules = 'Bump dotbot from `aa93350` to `ac5793c`'
const submodulesAlpha = 'Bump dotbot from `aa93350` to `acaaaac`'

tap.test('checkTargetMatchToPR', async t => {
  t.test('should return true when target is major', async t => {
    t.test('and PR is patch', async t => {
      t.ok(checkTargetMatchToPR(patchPRTitle, targetOptions.major))
    })
    t.test('and PR is patch in a subdirectory', async t => {
      t.ok(checkTargetMatchToPR(patchPRTitleInSubDirectory, targetOptions.major))
    })
    t.test('and PR is patch with pre-release version', async t => {
      t.ok(checkTargetMatchToPR(preReleaseUpgradePRTitle, targetOptions.major))
    })
    t.test('and PR is minor', async t => {
      t.ok(checkTargetMatchToPR(minorPRTitle, targetOptions.major))
    })
    t.test('and PR is major', async t => {
      t.ok(checkTargetMatchToPR(majorPRTitle, targetOptions.major))
    })
    t.test('and PR is major with multiple froms', async t => {
      t.ok(
        checkTargetMatchToPR(majorPRTitleWithMultipleFroms, targetOptions.major)
      )
    })
  })
  t.test('When target is minor', async t => {
    t.test('should return true if PR is patch', async t => {
      t.ok(checkTargetMatchToPR(patchPRTitle, targetOptions.minor))
    })
    t.test('should return true if PR is preminor', async t => {
      t.ok(checkTargetMatchToPR(preMinorPRTitle, targetOptions.minor))
    })
    t.test(
      'should return true if PR is patch with pre-release version',
      async t => {
        t.ok(
          checkTargetMatchToPR(preReleaseUpgradePRTitle, targetOptions.minor)
        )
      }
    )
    t.test('should return true if PR is minor', async t => {
      t.ok(checkTargetMatchToPR(minorPRTitle, targetOptions.minor))
    })
    t.test('should return false if PR is major', async t => {
      t.notOk(checkTargetMatchToPR(majorPRTitle, targetOptions.minor))
    })
    t.test(
      'should return false if PR is major and title has multiple from',
      async t => {
        t.notOk(
          checkTargetMatchToPR(
            majorPRTitleWithMultipleFroms,
            targetOptions.minor
          )
        )
      }
    )
  })
  t.test('When target is patch', async t => {
    t.test('should return true if PR is patch', async t => {
      t.ok(checkTargetMatchToPR(patchPRTitle, targetOptions.patch))
    })
    t.test('should return true if PR is prepatch', async t => {
      t.ok(checkTargetMatchToPR(prePatchPRTitle, targetOptions.patch))
    })

    t.test(
      'should return true if PR is pre-release patch is upgraded',
      async t => {
        t.ok(
          checkTargetMatchToPR(
            preReleaseToPathUpgradePRTitle,
            targetOptions.patch
          )
        )
      }
    )
    t.test(
      'should return true if PR is patch with pre-release version',
      async t => {
        t.ok(
          checkTargetMatchToPR(preReleaseUpgradePRTitle, targetOptions.patch)
        )
      }
    )

    t.test('should return false if PR is minor', async t => {
      t.notOk(checkTargetMatchToPR(minorPRTitle, targetOptions.patch))
    })
    t.test('should return false if PR is major', async t => {
      t.notOk(checkTargetMatchToPR(majorPRTitle, targetOptions.patch))
    })
    t.test(
      'should return false if PR is major and title has multiple from',
      async t => {
        t.notOk(
          checkTargetMatchToPR(
            majorPRTitleWithMultipleFroms,
            targetOptions.patch
          )
        )
      }
    )
  })
  t.test('should return true when', async t => {
    t.test('PR title has the same version', async t => {
      t.ok(checkTargetMatchToPR(sameVersion, targetOptions.prepatch))
    })
  })
  t.test('should return false when', async t => {
    t.test('PR is patch and target is prepatch', async t => {
      t.notOk(checkTargetMatchToPR(patchPRTitle, targetOptions.prepatch))
    })
    t.test('PR is minor and target is preminor', async t => {
      t.notOk(checkTargetMatchToPR(minorPRTitle, targetOptions.preminor))
    })
    t.test('PR is major and target is premajor', async t => {
      t.notOk(checkTargetMatchToPR(majorPRTitle, targetOptions.premajor))
    })
    t.test('PR is premajor and target is minor', async t => {
      t.notOk(checkTargetMatchToPR(preMajorPRTitle, targetOptions.minor))
    })
  })

  t.test('semver-like PR titles', async t => {
    t.test('semver to minor semver-like', async t => {
      t.notOk(checkTargetMatchToPR(semverLikeMinor, targetOptions.prepatch))
      t.notOk(checkTargetMatchToPR(semverLikeMinor, targetOptions.patch))
      t.ok(checkTargetMatchToPR(semverLikeMinor, targetOptions.minor))
      t.ok(checkTargetMatchToPR(semverLikeMinor, targetOptions.major))
    })

    t.test('semver to major semver-like', async t => {
      t.notOk(checkTargetMatchToPR(semverLikeMajor, targetOptions.prepatch))
      t.notOk(checkTargetMatchToPR(semverLikeMajor, targetOptions.patch))
      t.notOk(checkTargetMatchToPR(semverLikeMajor, targetOptions.minor))
      t.ok(checkTargetMatchToPR(semverLikeMajor, targetOptions.major))
    })

    t.test('semver-like to semver-like', async t => {
      t.notOk(checkTargetMatchToPR(semverLikeBothWay, targetOptions.prepatch))
      t.notOk(checkTargetMatchToPR(semverLikeBothWay, targetOptions.patch))
      t.notOk(checkTargetMatchToPR(semverLikeBothWay, targetOptions.minor))
      t.ok(checkTargetMatchToPR(semverLikeBothWay, targetOptions.major))
    })
  })

  t.test('submodules', async t => {
    t.notOk(checkTargetMatchToPR(submodules, targetOptions.prepatch))
    t.notOk(checkTargetMatchToPR(submodules, targetOptions.patch))
    t.notOk(checkTargetMatchToPR(submodules, targetOptions.minor))
    t.notOk(checkTargetMatchToPR(submodules, targetOptions.major))
    t.notOk(checkTargetMatchToPR(submodulesAlpha, targetOptions.major))
  })
})
