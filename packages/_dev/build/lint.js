#!/usr/bin/env node
const fix = process.argv.includes('--fix');
const failOnError = process.argv.includes('--fail-on-error');

const sources = (function () {
  try {
    return require('child_process')
      .execSync('git ls-files "packages/**.js"')
      .toString().trim().split('\n');
  }
  catch (e) {
    return ['build/**/*.js', 'src/**/*.js', 'tests/**/*.js'];
  }
}());

const CLIEngine = require('eslint').CLIEngine;

console.log('Linting...');

const cli = new CLIEngine({
  fix,
  useEslintrc: true,
});

const report = cli.executeOnFiles(sources);
const errors = CLIEngine.getErrorResults(report.results);

console.log(cli.getFormatter('table')(errors));

if (failOnError && errors.length) {
  throw 'Test failed';
}

if (fix) {
  CLIEngine.outputFixes(report);
}
