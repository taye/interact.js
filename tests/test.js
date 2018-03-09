import { jsdom } from 'jsdom';
import tape from 'tape';

import { scope, init as scopeInit } from '../src/scope';

const doc = jsdom('<!DOCTYPE html><html><body></body></html>');
const window = doc.defaultView;

scope.document = doc;

scopeInit(window);

export default tape;
