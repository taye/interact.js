'use strict';

var raf         = require('./utils/raf'),
    getWindow   = require('./utils/window').getWindow,
    isWindow    = require('./utils/isType').isWindow,
    domUtils    = require('./utils/domUtils'),
    signals     = require('./utils/signals'),
    defaultOptions = require('./defaultOptions');

var autoScroll = {
    defaults: {
        enabled     : false,
        container   : null,     // the item that is scrolled (Window or HTMLElement)
        margin      : 60,
        speed       : 300       // the scroll speed in pixels per second
    },

    interaction: null,
    i: null,    // the handle returned by window.setInterval
    x: 0, y: 0, // Direction each pulse is to scroll in

    isScrolling: false,
    prevTime: 0,

    start: function (interaction) {
        autoScroll.isScrolling = true;
        raf.cancel(autoScroll.i);

        autoScroll.interaction = interaction;
        autoScroll.prevTime = new Date().getTime();
        autoScroll.i = raf.request(autoScroll.scroll);
    },

    stop: function () {
        autoScroll.isScrolling = false;
        raf.cancel(autoScroll.i);
    },

    // scroll the window by the values in scroll.x/y
    scroll: function () {
        var options = autoScroll.interaction.target.options[autoScroll.interaction.prepared.name].autoScroll,
            container = options.container || getWindow(autoScroll.interaction.element),
            now = new Date().getTime(),
            // change in time in seconds
            dt = (now - autoScroll.prevTime) / 1000,
            // displacement
            s = options.speed * dt;

        if (s >= 1) {
            if (isWindow(container)) {
                container.scrollBy(autoScroll.x * s, autoScroll.y * s);
            }
            else if (container) {
                container.scrollLeft += autoScroll.x * s;
                container.scrollTop  += autoScroll.y * s;
            }

            autoScroll.prevTime = now;
        }

        if (autoScroll.isScrolling) {
            raf.cancel(autoScroll.i);
            autoScroll.i = raf.request(autoScroll.scroll);
        }
    },
    check: function (interactable, actionName) {
        var options = interactable.options;

        return  options[actionName].autoScroll && options[actionName].autoScroll.enabled;
    },
    onInteractionMove: function (arg) {
        var interaction = arg.interaction,
            pointer = arg.pointer;

        if (!(interaction.interacting()
            && autoScroll.check(interaction.target, interaction.prepared.name))) {
            return;
        }

        if (interaction.inertiaStatus.active) {
            autoScroll.x = autoScroll.y = 0;
            return;
        }

        var top,
            right,
            bottom,
            left,
            options = interaction.target.options[interaction.prepared.name].autoScroll,
            container = options.container || getWindow(interaction.element);

        if (isWindow(container)) {
            left   = pointer.clientX < autoScroll.margin;
            top    = pointer.clientY < autoScroll.margin;
            right  = pointer.clientX > container.innerWidth  - autoScroll.margin;
            bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
        }
        else {
            var rect = domUtils.getElementClientRect(container);

            left   = pointer.clientX < rect.left   + autoScroll.margin;
            top    = pointer.clientY < rect.top    + autoScroll.margin;
            right  = pointer.clientX > rect.right  - autoScroll.margin;
            bottom = pointer.clientY > rect.bottom - autoScroll.margin;
        }

        autoScroll.x = (right ? 1: left? -1: 0);
        autoScroll.y = (bottom? 1:  top? -1: 0);

        if (!autoScroll.isScrolling) {
            // set the autoScroll properties to those of the target
            autoScroll.margin = options.margin;
            autoScroll.speed  = options.speed;

            autoScroll.start(interaction);
        }
    }
};

signals.on('interaction-stop-active', function () {
    autoScroll.stop();
});

signals.on('interaction-move-done', autoScroll.onInteractionMove);

defaultOptions.perAction.autoScroll = autoScroll.defaults;

module.exports = autoScroll;