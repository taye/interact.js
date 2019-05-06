#!/usr/bin/bash
PATH=$PATH:$PWD/node_modules/.bin

RELEASE_BRANCH=$1
NEW_VERSION=$2

ROOT=$(dirname $(readlink -f $0))/..
INITIAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

main() {
  ensure_clean_index &&
    check_args &&
    check_version &&
    merge_to_release &&
    run_tests &&
    run_build &&
    bootstrap &&
    commit_and_tag &&
    push_and_publish &&

  # leave the release branch
  quit
}

ensure_clean_index() {
  echo_funcname

  # make sure the repo is clean
  git clean -fx dist/*
  if ! git diff-index HEAD --stat --exit-code; then
    echo
    quit "working directory must be clean" $?
  fi
}

check_args() {
  echo_funcname

  if [[ -z $RELEASE_BRANCH ]]; then
    quit "Missing release branch arg" 1
  fi
}

check_version() {
  echo_funcname

  NEW_VERSION=$(node $ROOT/scripts/version.js)
  NEW_TAG="v$(semver clean $NEW_VERSION)"

  if [[ $NEW_TAG == v ]]; then
    quit "failed parse version from '$NEW_VERSION'" 1
  fi

  # if the version tag already exists
  if [[ $(git tag -l $NEW_TAG) == $NEW_TAG ]]; then
    quit "$NEW_TAG tag already exists" 1
  fi
}

merge_to_release() {
  echo_funcname

  echo "checking out the '$RELEASE_BRANCH' branch"
  git checkout $RELEASE_BRANCH || exit $?
  git pull --ff-only

  # clean repo
  npx tsc --build --clean $ROOT
  git clean -fdX


  git merge --no-ff --no-edit $INITIAL_BRANCH || quit "failed to merge branches" $?
  npm run bootstrap || quit "bootstrapping failed" $?
}

run_tests() {
  echo_funcname

  npm run tsc_lint_test || quit "tests have failed" $?
}

run_build() {
  echo_funcname

  # copy README
  cp $ROOT/README.md packages/interactjs/ &&

  # copy license file
  npx lerna exec --no-private -- cp -v $ROOT/LICENSE . ||
    quit "failed to copy LICENSE"

  # generate .js and .d.ts files
  npx tsc --emitDeclarationOnly false -p $ROOT &&

  # copy .npmignore to all packages
  npx lerna exec --no-private -- "echo '# copied from [root]/.npmignore' > .npmignore
    cat ../../.npmignore >> .npmignore" &&

  # build interactjs bundle
  npm run build || exit $?
}

bootstrap() {
  npm run bootstrap
}

commit_and_tag() {
  echo_funcname

  # commit and add new version tag
  git add --all &&
    git commit -m $NEW_TAG &&
    git tag $NEW_TAG
}

push_and_publish() {
  echo_funcname

  if [[ $RELEASE_BRANCH == "next" ]]; then
    # publish to npm with "next" tag
    npx lerna exec --no-private -- npm publish --tag next
  else
    # publish with default tag
    npx lerna exec --no-private -- npm publish
  fi

  # push branch and tags to git origin
  git push --no-verify && git push --no-verify origin $NEW_TAG
}

echo_funcname() {
  echo -e "\n==== ${FUNCNAME[1]} ====\n"
}

quit() {
  if [ -n "$1" ]; then
    if [ -z "$2" ] || [ "$2" == 0 ]; then
      echo $1
    else
      echo $1 >&2
    fi
  fi

  git checkout -q $INITIAL_BRANCH > /dev/null
  exit $2
}

main
