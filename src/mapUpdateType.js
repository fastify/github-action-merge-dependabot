'use strict'

// NOTE: fetch-metadata only support the major, minor and patch update types for now, so I removed the `pre` types
const updateTypes = {
  major: 'version-update:semver-major',
  minor: 'version-update:semver-minor',
  patch: 'version-update:semver-patch',
  any: 'version-update:semver-any',
}

const updateTypesPriority = [
  updateTypes.any,
  updateTypes.major,
  updateTypes.minor,
  updateTypes.patch,
]

const mapUpdateType = input => {
  return updateTypes[input] || updateTypes.any
}

module.exports = {
  mapUpdateType,
  updateTypes,
  updateTypesPriority,
}
