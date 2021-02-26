const version = require('../scripts/getVersion')()

module.exports = process.env.INTERACT_OPEN
  ? {
    raw: `/**
 * interact.js ${version}
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */\n`,
    min: `/* interact.js ${version} | https://raw.github.com/taye/interact.js/main/LICENSE */\n`,
  }
  : {
    raw: `/**
 * interact.js ${version}
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * https://interactjs.io/license
 */\n`,
    min: `/* interact.js ${version} | https://interactjs.io/license */\n`,
  }
