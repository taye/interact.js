var dest = "./build";
var src = './src';

module.exports = {
  browserSync: {
    server: {
      // Serve up our build folder
      baseDir: dest
    }
  },
  markup: {
    src: src + "/htdocs/**",
    dest: dest
  },
  browserify: {
    // A separate bundle will be generated for each
    // bundle config in the list below
    bundleConfigs: [
      {
        entries: src + '/index.js',
        dest: dest,
        debug: true,
        outputName: 'interact.js',
        outputNameMin: 'interact.min.js',
        souremapComment: true,

        standalone: 'interact',
        transform: [[ 'babelify', {} ]],
        // Additional file extentions to make optional
        extensions: [],
      },
    ],
  },
  jshint: {
      src: src + "/**/*.js",
      settings: '.jshintrc'
  },
  production: {
    cssSrc: dest + '/*.css',
    jsSrc: dest + '/*.js',
    dest: dest
  }
};
