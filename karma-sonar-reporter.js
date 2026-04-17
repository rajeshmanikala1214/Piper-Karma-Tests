const fs = require('fs');

function SonarReporter(baseReporterDecorator, config, logger) {
  baseReporterDecorator(this);

  const log = logger.create('reporter.sonar');
  const outputFile = 'reports/test-execution.xml';

  let testCases = [];

  this.onSpecComplete = function (browser, result) {
    testCases.push({
      name: result.fullName,
      duration: result.time || 0,
      status: result.success ? 'passed' : (result.skipped ? 'skipped' : 'failed')
    });
  };

  this.onRunComplete = function () {
    let xml = `<testExecutions version="1">\n`;
    xml += `  <file path="karma-tests">\n`;

    testCases.forEach(tc => {
      xml += `    <testCase name="${tc.name}" duration="${tc.duration}">`;

      if (tc.status === 'failed') {
        xml += `<failure/>`;
      } else if (tc.status === 'skipped') {
        xml += `<skipped/>`;
      }

      xml += `</testCase>\n`;
    });

    xml += `  </file>\n`;
    xml += `</testExecutions>`;

    fs.writeFileSync(outputFile, xml);
    log.info(`Sonar test report generated at ${outputFile}`);
  };
}

SonarReporter.$inject = ['baseReporterDecorator', 'config', 'logger'];

module.exports = {
  'reporter:sonar': ['type', SonarReporter]
};