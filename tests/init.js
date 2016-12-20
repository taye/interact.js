const MockBrowser = require('mock-browser').mocks.MockBrowser;
const mock = new MockBrowser();

const window = mock.getWindow();

require('../src/utils/window').init(window);
