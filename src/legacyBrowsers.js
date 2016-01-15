const scope   = require('./scope');
const events  = require('./utils/events');
const browser = require('./utils/browser');
const iFinder = require('./utils/interactionFinder');

const toString = Object.prototype.toString;

if (!window.Array.isArray) {
  window.Array.isArray = function (obj) {
    return toString.call(obj) === '[object Array]';
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

// http://www.quirksmode.org/dom/events/click.html
// >Events leading to dblclick
//
// IE8 doesn't fire down event before dblclick.
// This workaround tries to fire a tap and doubletap after dblclick
function onIE8Dblclick (event) {
  const interaction = iFinder.search(event, event.type, event.target);

  if (!interaction) { return; }

  if (interaction.prevTap
      && event.clientX === interaction.prevTap.clientX
      && event.clientY === interaction.prevTap.clientY
      && event.target  === interaction.prevTap.target) {

    interaction.downTargets[0] = event.target;
    interaction.downTimes  [0] = new Date().getTime();

    scope.pointerEvents.collectEventTargets(interaction, event, event, event.target, 'tap');
  }
}

if (browser.isIE8) {
  const selectFix = function (event) {
    for (const interaction of scope.interactions) {
      if (interaction.interacting()) {
        interaction.target.checkAndPreventDefault(event);
      }
    }
  };

  const onDocIE8 = function onDocIE8 ({ doc, win }, signalName) {
    const eventMethod = signalName.indexOf('listen') === 0
      ? events.add : events.remove;

    // For IE's lack of Event#preventDefault
    eventMethod(doc, 'selectstart', selectFix);

    if (scope.pointerEvents) {
      eventMethod(doc, 'dblclick', onIE8Dblclick);
    }
  };

  scope.signals.on('add-document'   , onDocIE8);
  scope.signals.on('remove-document', onDocIE8);
}

module.exports = null;
