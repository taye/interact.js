var dest = './dist';
var src = './src';

module.exports = {
  dest: dest,
  browserSync: {
    server: {
      // Serve up our build folder
      baseDir: dest,
    },
  },
  markup: {
    src : src + '/htdocs/**',
    dest: dest,
  },
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
