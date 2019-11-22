#!/bin/bash
eval "$(ssh-agent -s)" # Start ssh-agent cache
chmod 600 $TRAVIS_BUILD_DIR/.travis/id_rsa # Allow read access to the private key
ssh-add $TRAVIS_BUILD_DIR/.travis/id_rsa # Add the private key to SSH

git config --global push.default matching
git remote add origin ssh://git@github.com/taye/interact.js.git

$TRAVIS_BUILD_DIR/scripts/release.sh $@
