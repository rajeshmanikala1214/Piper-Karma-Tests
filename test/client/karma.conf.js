// When running pre-release tests we want tests to fail if BrowserStack is not
// configured instead of falling back to the headless browser. That's what
// KARMA_TEST_NO_FALLBACK variable controls.
const useBrowserStack = (process.env.BROWSERSTACK_USERNAME && process.env.BROWSERSTACK_ACCESS_KEY) ||
  process.env.KARMA_TEST_NO_FALLBACK

const launchers = {
  bs_chrome: {
    base: 'BrowserStack',
    browser: 'chrome',
    os: 'Windows',
    os_version: '10'
  },
  bs_firefox: {
    base: 'BrowserStack',
    browser: 'firefox',
    os: 'Windows',
    os_version: '10'
  },
  bs_safari: {
    base: 'BrowserStack',
    browser: 'Safari',
    os: 'OS X',
    os_version: 'Big Sur'
  },
  bs_ie: {
    base: 'BrowserStack',
    browser: 'IE',
    browser_version: '11.0',
    os: 'Windows',
    os_version: '10'
  },
  bs_ie9: {
    base: 'BrowserStack',
    browser: 'IE',
    browser_version: '9.0',
    os: 'Windows',
    os_version: '7'
  }
}
module.exports = function (config) {
  config.set({
    // basePath resolves to the repo root
    basePath: '../..',

    frameworks: ['browserify', 'mocha'],

    files: [
      'test/client/*.js'
    ],

    exclude: [
      'test/client/karma.conf.js'
    ],

    preprocessors: {
      'test/client/*.js': ['browserify']
    },

    // dots for console output + junit for XML report
    reporters: ['dots', 'junit'],

    junitReporter: {
      // resolves to <basePath>/reports/TESTS-karma.xml
      // = repo-root/reports/TESTS-karma.xml
      outputDir: 'reports',
      outputFile: 'TESTS-karma.xml',
      useBrowserName: false,
      suite: 'KarmaTests'
    },

    port: 9876,

    // Piper injects PIPER_SELENIUM_HOSTNAME=karma into the karma container
    // This is the hostname Selenium uses to call back to Karma server
    hostname: process.env.PIPER_SELENIUM_HOSTNAME || '0.0.0.0',

    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,

    browsers: ['SeleniumChrome'],

    customLaunchers: {
      SeleniumChrome: {
        base: 'WebDriver',
        config: {
          // Piper injects PIPER_SELENIUM_WEBDRIVER_HOSTNAME=selenium
          hostname: process.env.PIPER_SELENIUM_WEBDRIVER_HOSTNAME || 'selenium',
          port: parseInt(process.env.PIPER_SELENIUM_WEBDRIVER_PORT) || 4444
        },
        browserName: 'chrome',
        name: 'Karma',
        flags: ['--no-sandbox', '--disable-dev-shm-usage'],
        pseudoActivityInterval: 30000
      }
    },

    captureTimeout: 210000,
    browserDisconnectTimeout: 210000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 210000,

    reportSlowerThan: 500,

    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-junit-reporter',
      'karma-browserify',
      'karma-webdriver-launcher'
    ],

    concurrency: 1,
    forceJSONP: true
  })
}