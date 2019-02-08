#!/bin/sh
PKG_DIR=$(dirname $(readlink -f $0))/..
export PATH=$PKG_DIR/node_modules/.bin:$PWD/node_modules/.bin:$PATH
export NODE_ENV=test
export TS_NODE_TRANSPILE_ONLY=true
export TS_NODE_PRETTY=true
export TS_NODE_COMPILER_OPTIONS="{ \"module\": \"commonjs\" }"

node -r ts-node/register -r $PKG_DIR/packages/types/index.ts $PKG_DIR/test/index.ts $@ | tap-spec && nyc report && nyc check-coverage
