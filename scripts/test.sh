#!/bin/sh
PKG_DIR=$(dirname $(readlink -f $0))/..
export PATH=$PKG_DIR/node_modules/.bin:$PWD/node_modules/.bin:$PATH
export NODE_ENV=test
export TS_NODE_TRANSPILE_ONLY=${TS_NODE_TRANSPILE_ONLY:-0}
export TS_NODE_PRETTY=${TS_NODE_PRETTY:-1}
export TS_NODE_COMPILER_OPTIONS=${TS_NODE_COMPILER_OPTIONS:-"{ \"module\": \"commonjs\" }"}

nyc --silent \
  node ${NODE_ARGS:+"$NODE_ARGS"} \
  -r ts-node/register \
  -r $PKG_DIR/packages/types/index.ts \
  $PKG_DIR/test/all.ts $@ |
  tap-spec && nyc report && nyc check-coverage
