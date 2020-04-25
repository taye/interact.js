const version = require('../scripts/getVersion')()

module.exports = {
  raw: `/**
 * interact.js ${version}
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */\n`,
  min: `/* interact.js ${version} | https://raw.github.com/taye/interact.js/master/LICENSE */\n`,
}
