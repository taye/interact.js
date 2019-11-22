#!/usr/bin/bash
PATH=$PATH:$PWD/node_modules/.bin

ROOT=$(dirname $(readlink -f $0))/..
INITIAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

main() {
  ensure_clean_index &&
    check_version &&
    checkout_clean_head &&
    bootstrap &&
    run_tests &&
    run_build &&
    commit_and_tag &&
    publish_and_push
}

ensure_clean_index() {
  echo_funcname

  # make sure the repo is clean
  git clean -fx **/dist/*
  if ! git diff-index HEAD --stat --exit-code; then
    echo
    quit "working directory must be clean" $?
  fi
}

check_version() {
  echo_funcname

  NEW_VERSION=$(node $ROOT/scripts/version.js)
  NEW_TAG="v$(semver clean $NEW_VERSION)"

  if [[ $NEW_TAG == v ]]; then
    quit "failed parsing version from '$NEW_VERSION'" 1
  fi

  # if the version tag already exists
  if [[ $(git tag -l $NEW_TAG) == $NEW_TAG ]]; then
    quit "$NEW_TAG tag already exists" 1
  fi
}

checkout_clean_head() {
  echo_funcname

  # detach HEAD
  git checkout -d || exit $?

  # clean repo
  git clean -fdX
}

run_tests() {
  echo_funcname

  npm run tsc_lint_test || quit "tests have failed" $?
}

run_build() {
  echo_funcname

  # copy README
  cp $ROOT/README.md interactjs/ &&

  # copy license file
  npx lerna exec --no-private -- cp -v $ROOT/LICENSE . ||
    quit "failed to copy LICENSE"

  # generate .d.ts files
  npx tsc -b -f &&

  # copy .npmignore to all packages
  npx lerna exec --no-private -- "echo '# copied from [root]/.npmignore' > .npmignore
    cat $ROOT/.npmignore >> .npmignore" &&

  ## generate esnext .js modules
  npm run esnext &&

  # bundle interactjs, generate docs, transpile modules
  npm run build || exit $?
}

bootstrap() {
  npm run bootstrap || quit "bootstrapping failed" $?
}

commit_and_tag() {
  echo_funcname

  # commit and add new version tag
  git add --all &&
    git add --force *interactjs/**/*.{ts,js,js.map} interactjs/dist &&
    git commit -m $NEW_TAG &&
    git tag $NEW_TAG
}

publish_and_push() {
  echo_funcname

  if [[ -n $NPM_TAG ]]; then
    tag_arg="--tag $NPM_TAG"
  fi

  # publish to npm with release tag if provided
  npx lerna exec --no-private -- npm publish $tag_arg || quit "failed to publish to npm" $?

  # push branch and tags to git origin
  git push --no-verify origin $NEW_TAG || quit "failed to push git tag $NEW_TAG to origin" $?
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

  exit $2
}

main
