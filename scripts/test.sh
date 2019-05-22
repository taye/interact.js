#!/bin/bash
PKG_DIR=$(dirname $(dirname $(readlink -f $0)))
if [ -z "$PKG_DIR" ]
then
    PKG_DIR=$(dirname $(dirname $0))
fi

export PATH=$PKG_DIR/node_modules/.bin:$PWD/node_modules/.bin:$PATH
export NODE_ENV=test
export TS_NODE_TRANSPILE_ONLY=${TS_NODE_TRANSPILE_ONLY:-0}
export TS_NODE_PRETTY=${TS_NODE_PRETTY:-1}
export TS_NODE_COMPILER_OPTIONS=${TS_NODE_COMPILER_OPTIONS:-"{ \"module\": \"commonjs\" }"}
export TS_NODE_PROJECT=${TS_NODE_PROJECT:-"$PWD/tsconfig.json"}

report=0

! [[ -n $TEST_RUNNER ]] && {
  report=1
  TEST_RUNNER=nyc
  TEST_RUNNER_ARGS=${TEST_RUNNER_ARGS:=--silent}
  EXEC_COMMAND=${EXEC_COMMAND:=node}
}

ENTRY_FILE=${ENTRY_FILE:-$PKG_DIR/test/all.ts}
EXEC_ARGS=${EXEC_ARGS:="--require $PKG_DIR/test/babel-register"}

NODE_ENV=test $TEST_RUNNER $TEST_RUNNER_ARGS \
  $EXEC_COMMAND \
  $EXEC_ARGS \
  --require $PKG_DIR/packages/types/index.ts \
  $ENTRY_FILE $@ |
  tap-spec

test_code=$?

if [[ "${test_code}${report}" == "01" ]]; then
  nyc report; nyc check-coverage
fi

exit $test_code
