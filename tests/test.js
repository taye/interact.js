import { jsdom } from 'jsdom';
import tape from 'tape';

import win from '../src/utils/window';
import domObjects from '../src/utils/domObjects';
import browser from '../src/utils/browser';
import scope from '../src/scope';

const doc = jsdom('<!DOCTYPE html><html><body></body></html>');
const window = doc.defaultView;

scope.document = doc;

win.init(window);
domObjects.init(window);
browser.init(window);

export default tape;
