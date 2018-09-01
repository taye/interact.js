#!/bin/sh
PKG_DIR=$(dirname $(readlink -f $0))/..
export PATH=$PKG_DIR/node_modules/.bin:$PWD/node_modules/.bin:$PATH
export NODE_ENV=test

nyc --silent node $PKG_DIR/test/index.js | tap-spec && nyc report && nyc check-coverage
