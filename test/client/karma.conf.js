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
    basePath: '',

    frameworks: ['browserify', 'mocha'],

    files: [
      'test/client/mocks.js',   // ✅ Fix for io issue
      'client/**/*.js',
      'test/client/**/*.js'
    ],

    exclude: [
      'test/client/karma.conf.js'
    ],

    preprocessors: {
      'client/**/*.js': ['browserify', 'coverage'],
      'test/client/**/*.js': ['browserify']
    },

    browserify: {
      debug: true
    },

    reporters: ['progress', 'coverage', 'junit'],

    coverageReporter: {
      dir: 'reports/coverage',
      reporters: [
        { type: 'lcovonly', file: 'lcov.info' },
        { type: 'cobertura', file: 'coverage.xml' },
        { type: 'text-summary' }
      ]
    },

    junitReporter: {
      outputDir: 'reports',
      outputFile: 'TESTS-karma.xml',
      useBrowserName: false,
      suite: 'KarmaTests'
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_DEBUG,

    autoWatch: false,
    singleRun: true,

    browsers: ['SeleniumChrome'],

    customLaunchers: {
      SeleniumChrome: {
        base: 'WebDriver',
        config: {
          hostname: 'selenium',
          port: 4444
        },
        browserName: 'chrome',
        flags: ['--no-sandbox', '--disable-dev-shm-usage']
      }
    },

    browserDisconnectTimeout: 210000,
    browserNoActivityTimeout: 210000,
    browserDisconnectTolerance: 3,

    concurrency: 1
  });
};