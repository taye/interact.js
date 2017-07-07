# make sure the repo is clean
git clean -fx dist/*
git diff-index HEAD --stat --exit-code || exit $?

INITIAL_REV=$(git rev-parse --abbrev-ref HEAD)

echo 'checking out the "unstable" branch'
git checkout unstable || exit $?

git merge --no-ff --no-edit $INITIAL_REV || exit $?

# preversion tests must pass
npm run preversion || exit $?

# bump the version in package.json
NEW_VERSION=$(node build/bump prerelease)
NEW_TAG=$(echo "v$NEW_VERSION" | sed 's/[+].*//')

npm run build &&
  git commit -m "v$NEW_VERSION" -- package.json dist || exit $?

# add new version tag
if git tag $NEW_TAG; then
  # push branch and tags to git origin and publish to npm
  git tag --force next &&
    git push &&
    git push origin $NEW_TAG next &&
    npm publish --tag next
else
  #if the version tag already exists, reset head to previous commit and exit
  err=$?
  git reset HEAD@{1}
  exit $err
fi

# leave the "unstable" branch
git checkout $INITIAI_REV
