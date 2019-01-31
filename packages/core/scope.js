import * as utils from '@interactjs/utils';
import domObjects from '@interactjs/utils/domObjects';
import defaults from './defaultOptions';
import Eventable from './Eventable';
import InteractableBase from './Interactable';
import InteractEvent from './InteractEvent';
import interactions from './interactions';
const { win, browser, raf, Signals, events, } = utils;
export function createScope() {
    return new Scope();
}
export class Scope {
    constructor() {
        // FIXME Signals
        this.signals = new Signals();
        this.browser = browser;
        this.events = events;
        this.utils = utils;
        this.defaults = utils.clone(defaults);
        this.Eventable = Eventable;
        this.InteractEvent = InteractEvent;
        this.interactables = new InteractableSet(this);
        // all documents being listened to
        this.documents = [];
        const scope = this;
        this.Interactable = class Interactable extends InteractableBase {
            get _defaults() { return scope.defaults; }
            set(options) {
                super.set(options);
                scope.interactables.signals.fire('set', {
                    options,
                    interactable: this,
                });
                return this;
            }
            unset() {
                super.unset();
                scope.interactables.signals.fire('unset', { interactable: this });
            }
        };
    }
    init(window) {
        return initScope(this, window);
    }
    addDocument(doc, options) {
        // do nothing if document is already known
        if (this.getDocIndex(doc) !== -1) {
            return false;
        }
        const window = win.getWindow(doc);
        options = options ? utils.extend({}, options) : {};
        this.documents.push({ doc, options });
        events.documents.push(doc);
        // don't add an unload event for the main document
        // so that the page may be cached in browser history
        if (doc !== this.document) {
            events.add(window, 'unload', this.onWindowUnload);
        }
        this.signals.fire('add-document', { doc, window, scope: this, options });
    }
    removeDocument(doc) {
        const index = this.getDocIndex(doc);
        const window = win.getWindow(doc);
        const options = this.documents[index].options;
        events.remove(window, 'unload', this.onWindowUnload);
        this.documents.splice(index, 1);
        events.documents.splice(index, 1);
        this.signals.fire('remove-document', { doc, window, scope: this, options });
    }
    onWindowUnload(event) {
        this.removeDocument(event.target);
    }
    getDocIndex(doc) {
        for (let i = 0; i < this.documents.length; i++) {
            if (this.documents[i].doc === doc) {
                return i;
            }
        }
        return -1;
    }
    getDocOptions(doc) {
        const docIndex = this.getDocIndex(doc);
        return docIndex === -1 ? null : this.documents[docIndex].options;
    }
}
class InteractableSet {
    constructor(scope) {
        this.scope = scope;
        this.signals = new utils.Signals();
        // all set interactables
        this.list = [];
    }
    new(target, options) {
        options = utils.extend(options || {}, {
            actions: this.scope.actions,
        });
        const interactable = new this.scope.Interactable(target, options, this.scope.document);
        this.scope.addDocument(interactable._doc);
        this.scope.interactables.list.push(interactable);
        this.scope.interactables.signals.fire('new', {
            target,
            options,
            interactable,
            win: this.scope._win,
        });
        return interactable;
    }
    indexOfElement(target, context) {
        context = context || this.scope.document;
        const list = this.list;
        for (let i = 0; i < list.length; i++) {
            const interactable = list[i];
            if (interactable.target === target && interactable._context === context) {
                return i;
            }
        }
        return -1;
    }
    get(element, options, dontCheckInContext) {
        const ret = this.list[this.indexOfElement(element, options && options.context)];
        return ret && (utils.is.string(element) || dontCheckInContext || ret.inContext(element)) ? ret : null;
    }
    forEachMatch(element, callback) {
        for (const interactable of this.list) {
            let ret;
            if ((utils.is.string(interactable.target)
                // target is a selector and the element matches
                ? (utils.is.element(element) && utils.dom.matchesSelector(element, interactable.target))
                // target is the element
                : element === interactable.target) &&
                // the element is in context
                (interactable.inContext(element))) {
                ret = callback(interactable);
            }
            if (ret !== undefined) {
                return ret;
            }
        }
    }
}
export function initScope(scope, window) {
    win.init(window);
    domObjects.init(window);
    browser.init(window);
    raf.init(window);
    events.init(window);
    interactions.install(scope);
    scope.document = window.document;
    return scope;
}
//# sourceMappingURL=scope.js.map