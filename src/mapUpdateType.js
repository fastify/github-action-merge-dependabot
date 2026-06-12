// NOTE: fetch-metadata only support the major, minor and patch update types for now, so I removed the `pre` types
export const updateTypes = {
  major: 'version-update:semver-major',
  minor: 'version-update:semver-minor',
  patch: 'version-update:semver-patch',
  any: 'version-update:semver-any',
}

export const updateTypesPriority = [
  updateTypes.patch,
  updateTypes.minor,
  updateTypes.major,
  updateTypes.any,
]

export const mapUpdateType = input => {
  return updateTypes[input] || updateTypes.any
}
