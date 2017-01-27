const dest = './dist';

module.exports = {
  dest: dest,
  browserify: {
    // A separate bundle will be generated for each bundle config below
    bundleConfigs: [
      {
        entries      : 'index.js',
        dest         : dest,
        debug        : true,
        outputName   : 'interact.js',
        outputNameMin: 'interact.min.js',
        headerFile   : 'src/header.js',

        standalone   : 'interact',
        transform    : [[ 'babelify', {} ]],
        // Additional file extentions to make optional
        extensions   : [],
      },
    ],
  },
};
