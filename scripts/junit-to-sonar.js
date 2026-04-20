'use strict'

const fs = require('fs')
const path = require('path')

const inputPath = process.argv[2] || 'reports/TESTS-karma.xml'
const outputPath = process.argv[3] || 'reports/test-execution.xml'

const xml = fs.readFileSync(inputPath, 'utf8')

// Map classname prefix to test file path
function classnameToFile(classname) {
  // classname looks like ".Karma", ".Karma result", ".stringify", ".util"
  const clean = classname.replace(/^\./, '').trim()
  const base = clean.split(' ')[0].toLowerCase()
  const mapping = {
    'karma': 'test/client/karma.spec.js',
    'stringify': 'test/client/stringify.spec.js',
    'util': 'test/client/util.spec.js'
  }
  return mapping[base] || 'test/client/' + base + '.spec.js'
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Parse testcase elements using regex (no external deps needed)
const testcaseRegex = /<testcase([^>]*)(?:\/>|>([\s\S]*?)<\/testcase>)/g
const attrRegex = /(\w+)="([^"]*)"/g

const fileMap = {}

let match
while ((match = testcaseRegex.exec(xml)) !== null) {
  const attrStr = match[1]
  const inner = match[2] || ''

  const attrs = {}
  let attrMatch
  while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
    attrs[attrMatch[1]] = attrMatch[2]
  }

  const name = escapeXml(attrs.name || 'unknown')
  const timeMs = Math.max(1, Math.round(parseFloat(attrs.time || '0') * 1000))
  const classname = attrs.classname || '.unknown'
  const filepath = classnameToFile(classname)

  if (!fileMap[filepath]) fileMap[filepath] = []

  let testCaseXml
  if (inner.includes('<failure')) {
    const msgMatch = inner.match(/message="([^"]*)"/)
    const msg = msgMatch ? escapeXml(msgMatch[1]) : 'Test failed'
    testCaseXml = `    <testCase name="${name}" duration="${timeMs}">\n      <failure message="${msg}"></failure>\n    </testCase>`
  } else if (inner.includes('<error')) {
    testCaseXml = `    <testCase name="${name}" duration="${timeMs}">\n      <error message="error"></error>\n    </testCase>`
  } else if (inner.includes('<skipped')) {
    testCaseXml = `    <testCase name="${name}" duration="${timeMs}">\n      <skipped message="skipped"></skipped>\n    </testCase>`
  } else {
    testCaseXml = `    <testCase name="${name}" duration="${timeMs}"/>`
  }

  fileMap[filepath].push(testCaseXml)
}

const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<testExecutions version="1">']

for (const [filepath, cases] of Object.entries(fileMap)) {
  lines.push(`  <file path="${filepath}">`)
  cases.forEach(c => lines.push(c))
  lines.push('  </file>')
}

lines.push('</testExecutions>')

const output = lines.join('\n')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, output, 'utf8')

console.log('Written:', outputPath)
console.log('Files:', Object.keys(fileMap).join(', '))
console.log('Total testCases:', Object.values(fileMap).reduce((s, a) => s + a.length, 0))