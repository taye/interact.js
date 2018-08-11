#!/usr/bin/sh
NODE_ENV=test npx nyc --silent node $(dirname $(readlink -f $0))/../test/index.js | tap-spec && nyc report && nyc check-coverage
