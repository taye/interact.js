import domator from 'domator';
import { jsdom } from 'jsdom';

const doc = typeof window === 'undefined'
  ? jsdom('<!DOCTYPE html><html><body></body></html>')
  : window.document;

domator.setDocument(doc);

export {
  domator,
  doc,
  jsdom,
};

export default domator;
