import * as is from './is';
import extend  from './extend';

export default function normalize (type, listener, result) {
  result = result || {};

  if (is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (is.array(type)) {
    return type.reduce((acc, t) => extend(acc, normalize(t, listener, result)), {});
  }

  // ({ type: fn }) -> ('', { type: fn })
  if (is.object(type)) {
    listener = type;
    type = '';
  }

  if (is.func(listener)) {
    result[type] = result[type] || [];
    result[type].push(listener);
  }
  else if (is.array(listener)) {
    for (const l of listener) {
      normalize(type, l, result);
    }
  }
  else if (is.object(listener)) {
    for (const prefix in listener) {
      normalize(`${type}${prefix}`, listener[prefix], result);
    }
  }

  return result;
}
