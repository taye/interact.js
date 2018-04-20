NEW_VERSION=$1
RELEASE_BRANCH="stable"
BUILD_ARG="--no-metadata"

if [[ $NEW_VERSION == "prerelease" ]]; then
  RELEASE_BRANCH="unstable"
  BUILD_ARG=""
fi

main() {
  ensure_clean_index
  merge_to_release
  run_preversion_tests
  bump_version
  run_build
  commit_and_tag
  push_and_publish

  # leave the "unstable" branch
  quit
}

ensure_clean_index() {
  echo_funcname

  # make sure the repo is clean
  git clean -fx dist/*
  if ! git diff-index HEAD --stat --exit-code; then
    quit "working directory must be clean" $?
  fi
}

merge_to_release() {
  echo_funcname

  INITIAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

  echo "checking out the '$RELEASE_BRANCH' branch"
  git checkout $RELEASE_BRANCH || exit $?

  git merge --no-ff --no-edit $INITIAL_BRANCH || quit "failed to merge branches" $?
}

run_preversion_tests() {
  echo_funcname

  # preversion tests must pass
  npm run preversion || quit "tests have failed" $?
}

bump_version() {
  echo_funcname

  # bump the version in package.json
  NEW_VERSION=$(node packages/_dev/build/bump $NEW_VERSION)

  if [[ -z $NEW_VERSION ]]; then
    quit "failed to bump version" 1
  fi

  NEW_TAG="v$(semver clean $NEW_VERSION)"

  # if the version tag already exists
  if [[ $(git tag -l $NEW_TAG) == $NEW_TAG ]]; then
    quit "$NEW_TAG tag already exists" 1
  fi

  # add package version change
  git add package.json package-lock.json
}

run_build() {
  echo_funcname

  npm run build -- $BUILD_ARG || exit $?
}

commit_and_tag() {
  echo_funcname

  # commit and add new version tag
  git add -- package.json package-lock.json dist
  git commit -m "v$NEW_VERSION"
  git tag $NEW_TAG
}

push_and_publish() {
  echo_funcname

  # push branch and tags to git origin
  git push --no-verify && git push --no-verify origin $NEW_TAG &&

  if [[ $NEW_VERSION == "prerelease" ]]; then
    # publish to npm with "next" tag
    git tag --force next &&
      git push --no-verify -f origin next &&
      npm publish --tag next
  else
    # publish with default "latest" tag
    npm publish
  fi
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

  git checkout $INITIAL_BRANCH > /dev/null
  exit $2
}

main
