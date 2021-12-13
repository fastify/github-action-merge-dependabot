'use strict'

const yaml = require('js-yaml')
const fs = require('fs')

module.exports = function factory(args, logger) {
  // DO WHAT YOU WANT IN SYNC
  // This function will be called for each REPO you are processing

  return {
    onRepo(repo) {
      logger(`Processing ${repo}`)
    },
    async onFile(file) {
      if (file.includes('.github/workflows')) {
        logger(`Processing ${file}`)

        const fileContent = fs.readFileSync(file, 'utf8')
        const oldModuleVersion = 'fastify/github-action-merge-dependabot@v2'
        if (!fileContent.includes(oldModuleVersion)) {
          return
        }

        const doc = yaml.load(fileContent);
        const jobs = Object.keys(doc.jobs)
        for (const jobName of jobs) {
          logger(`Checking ${jobName}`)
          const job = doc.jobs[jobName]
          const automergeStep = job.steps.find(step => step.uses && step.uses.startsWith(oldModuleVersion))

          if (automergeStep !== undefined) {
            logger(`\tUpgrading job: ${jobName}`)
            if (!job.permissions) {
              const steps = job.steps
              delete job.steps // doing this to order the yml output
              job.permissions = {}
              job.steps = steps
            }

            automergeStep.uses = 'fastify/github-action-merge-dependabot@v3.0.0'
            job.permissions['pull-requests'] = 'write'
            job.permissions['contents'] = 'write'
          }
        }

        const fileYml = yaml.dump(doc);
        fs.writeFileSync(file, fileYml, 'utf8');
      }
    },
    // onComplete (repo) {
    // OPTIONAL, sync function called after all the processed files
    // }
  }
}
