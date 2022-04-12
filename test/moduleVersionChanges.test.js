'use strict'
const tap = require('tap')

const { moduleChanges } = require('./moduleChanges')
const { targetOptions } = require('../src/getTargetInput')
const { checkModuleVersionChanges } = require('../src/moduleVersionChanges')

tap.test('checkModuleVersionChanges', async t => {
  t.test('should return true when target is major', async t => {
    t.test('and PR is patch', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.patch, targetOptions.major))
    })
    t.test('and PR is patch with pre-release version', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.preReleaseUpgrade, targetOptions.major))
    })
    t.test('and PR is minor', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.minor, targetOptions.major))
    })
    t.test('and PR is major', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.major, targetOptions.major))
    })
  })
  t.test('When target is minor', async t => {
    t.test('should return true if PR is patch', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.patch, targetOptions.minor))
    })
    t.test('should return true if PR is preminor', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.preMinor, targetOptions.minor))
    })
    t.test(
      'should return true if PR is patch with pre-release version',
      async t => {
        t.ok(
          checkModuleVersionChanges(moduleChanges.preReleaseUpgrade, targetOptions.minor)
        )
      }
    )
    t.test('should return true if PR is minor', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.minor, targetOptions.minor))
    })
    t.test('should return false if PR is major', async t => {
      t.notOk(checkModuleVersionChanges(moduleChanges.major, targetOptions.minor))
    })
  })
  t.test('When target is patch', async t => {
    t.test('should return true if PR is patch', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.patch, targetOptions.patch))
    })
    t.test('should return true if PR is prepatch', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.prePatch, targetOptions.patch))
    })

    t.test(
      'should return true if PR is pre-release patch is upgraded',
      async t => {
        t.ok(
          checkModuleVersionChanges(
            moduleChanges.preReleaseToPathUpgrade,
            targetOptions.patch
          )
        )
      }
    )
    t.test(
      'should return true if PR is patch with pre-release version',
      async t => {
        t.ok(
          checkModuleVersionChanges(moduleChanges.preReleaseUpgrade, targetOptions.patch)
        )
      }
    )

    t.test('should return false if PR is minor', async t => {
      t.notOk(checkModuleVersionChanges(moduleChanges.minor, targetOptions.patch))
    })
    t.test('should return false if PR is major', async t => {
      t.notOk(checkModuleVersionChanges(moduleChanges.major, targetOptions.patch))
    })
  })
  t.test('should return true when', async t => {
    t.test('PR title has the same version', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.sameVersion, targetOptions.prepatch))
    })
  })
  t.test('should return false when', async t => {
    t.test('PR is patch and target is prepatch', async t => {
      t.notOk(checkModuleVersionChanges(moduleChanges.patch, targetOptions.prepatch))
    })
    t.test('PR is minor and target is preminor', async t => {
      t.notOk(checkModuleVersionChanges(moduleChanges.minor, targetOptions.preminor))
    })
    t.test('PR is major and target is premajor', async t => {
      t.notOk(checkModuleVersionChanges(moduleChanges.major, targetOptions.premajor))
    })
    t.test('PR is premajor and target is minor', async t => {
      t.notOk(checkModuleVersionChanges(moduleChanges.preMajor, targetOptions.minor))
    })
  })

  t.test('submodules', async t => {
    t.notOk(checkModuleVersionChanges(moduleChanges.submodules, targetOptions.prepatch))
    t.notOk(checkModuleVersionChanges(moduleChanges.submodules, targetOptions.patch))
    t.notOk(checkModuleVersionChanges(moduleChanges.submodules, targetOptions.minor))
    t.notOk(checkModuleVersionChanges(moduleChanges.submodules, targetOptions.major))
  })

  t.test('should return false when', async t => {
    t.test('PR has both minor and major changes and target is minor', async t => {
      t.notOk(checkModuleVersionChanges(moduleChanges.multiplePackagesMajorMinor, targetOptions.minor))
    })
  })

  t.test('should return true when', async t => {
    t.test('PR has both minor and major changes and target is major', async t => {
      t.ok(checkModuleVersionChanges(moduleChanges.multiplePackagesMajorMinor, targetOptions.major))
    })
  })

  t.test('should handle multiple files in the diff', async t => {
    t.notOk(checkModuleVersionChanges(moduleChanges.multipleFilesDiff, targetOptions.minor))
    t.ok(checkModuleVersionChanges(moduleChanges.multipleFilesDiff, targetOptions.major))
  })

  t.test('should deal with invalid package version', async t => {
    t.notOk(checkModuleVersionChanges({ 'github-action-merge-dependabot-': { insert: '', delete: '' } }, targetOptions.minor))
  })
})
