PATH=$PATH:$PWD/node_modules/.bin

NEW_VERSION=$1
RELEASE_BRANCH="stable"
BUILD_ARG="--no-metadata"

ROOT=$(dirname $(readlink -f $0))/..

if [[ $NEW_VERSION == "prerelease" ]]; then
  RELEASE_BRANCH="unstable"
  BUILD_ARG="--metadata"
fi

main() {
  ensure_clean_index &&
    merge_to_release &&
    run_tests &&
    bump_version &&
    run_build &&
    bootstrap &&
    commit_and_tag &&
    push_and_publish &&

  # leave the "unstable" branch
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

merge_to_release() {
  echo_funcname

  INITIAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

  echo "checking out the '$RELEASE_BRANCH' branch"
  git checkout $RELEASE_BRANCH || exit $?

  git merge --no-ff --no-edit $INITIAL_BRANCH || quit "failed to merge branches" $?
  npx lerna bootstrap || quit "bootstrapping failed" $?
}

run_tests() {
  echo_funcname

  npx lerna run test || quit "tests have failed" $?
  cd $ROOT
}

bump_version() {
  echo_funcname

  # bump the version in package.json
  NEW_VERSION=$($ROOT/scripts/bump.js $NEW_VERSION)

  if [[ -z $NEW_VERSION ]]; then
    quit "failed to bump version" 1
  fi

  NEW_TAG="v$(semver clean $NEW_VERSION)"

  # if the version tag already exists
  if [[ $(git tag -l $NEW_TAG) == $NEW_TAG ]]; then
    quit "$NEW_TAG tag already exists" 1
  fi

  npx lerna version --no-git-tag-version $NEW_VERSION &&
    npx lerna exec -- $ROOT/scripts/bump.js $NEW_VERSION > /dev/null ||
    quit "failed to bump version" 1

  cd $ROOT
}

run_build() {
  echo_funcname

  # copy license file
  npx lerna exec --no-private -- cp -v $ROOT/LICENSE .

  npx lerna run --no-private build -- $BUILD_ARG || exit $?

  cd $ROOT
}

bootstrap() {
  npx lerna run bootstrap
}

commit_and_tag() {
  echo_funcname

  # commit and add new version tag
  git add --all &&
    git commit -m "v$NEW_VERSION" &&
    git tag $NEW_TAG
}

push_and_publish() {
  echo_funcname

  # push branch and tags to git origin
  git push --no-verify && git push --no-verify origin $NEW_TAG &&

  if [[ $RELEASE_BRANCH == "unstable" ]]; then
    # publish to npm with "next" tag
    git tag --force next &&
      git push --no-verify -f origin next &&
      npx lerna exec --no-private -- npm publish --tag next
  else
    # publish with default "latest" tag
    npx lerna exec --no-private -- npm publish
  fi

  cd $ROOT
}

echo_funcname() {
  echo -e "\n==== ${FUNCNAME[1]} ====\n"
  pwd
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
