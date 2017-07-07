# make sure the repo is clean
git clean -fx dist/*
git diff-index HEAD --stat --exit-code || exit $?

INITIAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo 'checking out the "unstable" branch'
git checkout unstable || exit $?

git merge --no-ff --no-edit $INITIAL_BRANCH || exit $?

# preversion tests must pass
npm run preversion || exit $?

# bump the version in package.json
NEW_VERSION=$(node build/bump prerelease)
NEW_TAG=$(echo "v$NEW_VERSION" | sed 's/[+].*//')

#if the version tag already exists, reset head to previous commit and exit
if [ git cat-file -e $NEW_TAG ]; then
  exit 1
fi

npm run build || exit $?

if [ ! git diff --quiet next ]; then
  echo files of this build and the existing "next" tag are identical
  exit 1
fi


git commit -m "v$NEW_VERSION" -- package.json dist || exit $?

# add new version tag
git tag $NEW_TAG
# push branch and tags to git origin and publish to npm
git tag --force next &&
  git push &&
  git push origin $NEW_TAG next &&
  npm publish --tag next

# leave the "unstable" branch
git checkout $INITIAL_BRANCH
