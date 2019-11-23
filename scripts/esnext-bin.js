#!/usr/bin/env node
const [,, ...args] = process.argv

require('./esnext')(args.length ? args : undefined)
