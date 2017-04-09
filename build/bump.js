const version = require('./version');

const [,, release, prereleaseId] = process.argv;

let newVersion;

if (release) {
  newVersion = version.bump({
    release,
    prereleaseId,
  });
}
// if this was run with no arguments, get the current version with
// updated build metadata
else {
  newVersion = version.get();
}

version.write(newVersion);
console.log(newVersion);
