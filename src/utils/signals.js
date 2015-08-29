'use strict';

var listeners = {
    // signalName: [listeners],
};

var arr = require('./arr');

var signals = {
    on: function (name, listener) {
        if (!listeners[name]) {
            listeners[name] = [listener];
            return;
        }

        listeners[name].push(listener);
    },
    off: function (name, listener) {
        if (!listeners[name]) { return; }

        var index = arr.indexOf(listeners[name], listener);

        if (index !== -1) {
            listeners[name].splice(index, 1);
        }
    },
    fire: function (name, arg) {
        var targetListeners = listeners[name];

        if (!targetListeners) { return; }

        for (var i = 0; i < targetListeners.length; i++) {
            targetListeners[i](arg);
        }
    },
    listeners: listeners
};

module.exports = signals;
