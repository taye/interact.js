#!/bin/bash
eval "$(ssh-agent -s)" # Start ssh-agent cache
chmod 600 $HOME/deploy_key # Allow read access to the private key
ssh-add $HOME/deploy_key # Add the private key to SSH

git remote set-url origin ssh://git@github.com/taye/interact.js.git

$TRAVIS_BUILD_DIR/scripts/release.sh $@
