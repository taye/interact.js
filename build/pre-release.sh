git clean -fx dist/* &&
  git diff-index HEAD --stat --exit-code &&
  git merge --no-ff --no-edit master &&
  NEW_VERSION=$(node build/bump prerelease) &&
  git add package.json &&
  npm run preversion &&
  npm run build &&
  git commit -m \"v$NEW_VERSION\" -- package.json dist &&
  git tag \"v$NEW_VERSION\"
