#!/usr/bin/env node
const argv = require('yargs')
  .defaults({
    fix: false,
    failOnError: false,
  })
  .option('sources', {
    array: true,
    default: getSources,
  })
  .argv;

function getSources () {
  const glob = require('glob');

  return [
    '+(packages|src|examples|test)/**/*.js',
    './*.js',
  ].reduce((acc, pattern) => [
    ...acc,
    ...glob.sync(pattern, { ignore: '**/node_modules/**' }),
  ], []);
}

const CLIEngine = require('eslint').CLIEngine;

console.log('Linting...');

const cli = new CLIEngine({
  fix: argv.fix,
  useEslintrc: true,
});

const report = cli.executeOnFiles(argv.sources);
const errors = CLIEngine.getErrorResults(report.results);

console.log(cli.getFormatter('table')(errors));

if (argv.failOnError && errors.length) {
  throw 'Test failed';
}

if (argv.fix) {
  CLIEngine.outputFixes(report);
}
