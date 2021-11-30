'use strict'

const yaml = require('js-yaml')
const fs   = require('fs')

module.exports = function factory (args, logger) {
  // DO WHAT YOU WANT IN SYNC
  // This function will be called for each REPO you are processing

  return {
    // onRepo (repo) {
    //   // OPTIONAL, sync function called before processing the files
    // },
    async onFile (file) {
      if(file.includes('.github/workflows')) {
        const doc = yaml.load(fs.readFileSync(file, 'utf8'));
        console.log(doc.jobs.automerge);
        const fileYml = yaml.dump(doc);
        fs.writeFileSync(file, fileYml, 'utf8');
      }
      // MANDATORY, do what you whant to each file of your project.
      // The files are processed sequentially and, if you return a promise
      // it will be waited.
      // If you will throw an error, it will be logged but all will continue
    },
    // onComplete (repo) {
    //   // OPTIONAL, sync function called after all the processed files
    // }
  }
}
