#!/usr/bin/bash
rm -r packages/interactjs/dist
rm packages/**/*.js packages/**/*.js.map
tsc -b --clean
