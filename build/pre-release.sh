# make sure the repo is clean
git clean -fx dist/*
if ! git diff-index HEAD --stat --exit-code; then
  echo working directory must be clean
  exit $?
fi

INITIAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

function quit {
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

echo 'checking out the "unstable" branch'
git checkout unstable || exit $?

git merge --no-ff --no-edit $INITIAL_BRANCH || quit "failed to merge branches" $?

# preversion tests must pass
npm run preversion || quit 'tests have failed' $?

# bump the version in package.json
NEW_VERSION=$(node build/bump prerelease)
NEW_TAG=$(echo "v$NEW_VERSION" | sed 's/[+].*//')

#if the version tag already exists
if git rev-parse --verify $NEW_TAG > /dev/null; then
  quit "$NEW_TAG tag already exists" 1
fi

npm run build || exit $?

# commit and add new version tag
git commit -m "v$NEW_VERSION" -- package.json dist
git tag $NEW_TAG

# push branch and tags to git origin and publish to npm
git tag --force next &&
  git push &&
  git push origin $NEW_TAG next &&
  npm publish --tag next

# leave the "unstable" branch
quit
