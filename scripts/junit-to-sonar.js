'use strict'

const fs = require('fs')
const path = require('path')

const inputPath = process.argv[2] || 'reports/TESTS-karma.xml'
const outputPath = process.argv[3] || 'reports/test-execution.xml'

const xml = fs.readFileSync(inputPath, 'utf8')

function classnameToFile(classname) {
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
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Extract attribute value robustly - handles both single and double quotes
// and entity-encoded values like &quot;
function getAttr(tag, attrName) {
  // Try double-quoted
  let re = new RegExp(attrName + '="([^"]*)"')
  let m = tag.match(re)
  if (m) return m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  // Try single-quoted
  re = new RegExp(attrName + "='([^']*)'")
  m = tag.match(re)
  if (m) return m[1]
  return null
}

// Split the XML into individual testcase blocks
// Strategy: find all <testcase ...> opening tags, then determine if self-closing or has children
const results = []

// Match all testcase elements - both self-closing and with children
// We split the XML on <testcase to get each piece
const parts = xml.split('<testcase')

for (let i = 1; i < parts.length; i++) {
  const part = parts[i]
  
  // Reconstruct the tag opener
  // Find where the opening tag ends (the first >)
  const tagEndIdx = part.indexOf('>')
  if (tagEndIdx === -1) continue
  
  const openTag = part.substring(0, tagEndIdx)
  const afterTag = part.substring(tagEndIdx)
  
  // Check if self-closing
  const isSelfClosing = openTag.trimEnd().endsWith('/')
  
  // Extract attributes from the opening tag
  const name = getAttr(openTag, 'name')
  const timeStr = getAttr(openTag, 'time')
  const classname = getAttr(openTag, 'classname')
  
  if (!name) continue
  
  const timeMs = Math.max(1, Math.round(parseFloat(timeStr || '0') * 1000))
  const filepath = classnameToFile(classname || '.unknown')
  
  // Get inner content if not self-closing
  let inner = ''
  if (!isSelfClosing) {
    const closeIdx = afterTag.indexOf('</testcase>')
    if (closeIdx !== -1) {
      inner = afterTag.substring(1, closeIdx) // skip the > at position 0
    }
  }
  
  // Determine test status
  let status = 'passed'
  let failureMsg = 'Test failed'
  let errorMsg = 'Test error'
  
  if (inner.includes('<failure')) {
    status = 'failure'
    const fmsgMatch = inner.match(/message="([^"]*)"/)
    if (fmsgMatch) failureMsg = fmsgMatch[1]
  } else if (inner.includes('<error')) {
    status = 'error'
    const emsgMatch = inner.match(/message="([^"]*)"/)
    if (emsgMatch) errorMsg = emsgMatch[1]
  } else if (inner.includes('<skipped')) {
    status = 'skipped'
  }
  
  results.push({ name, timeMs, filepath, status, failureMsg, errorMsg })
}

// Group by file
const fileMap = {}
for (const r of results) {
  if (!fileMap[r.filepath]) fileMap[r.filepath] = []
  fileMap[r.filepath].push(r)
}

// Build output XML
const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<testExecutions version="1">']

for (const [filepath, cases] of Object.entries(fileMap)) {
  lines.push(`  <file path="${filepath}">`)
  for (const c of cases) {
    const eName = escapeXml(c.name)
    if (c.status === 'failure') {
      const eMsg = escapeXml(c.failureMsg)
      lines.push(`    <testCase name="${eName}" duration="${c.timeMs}">`)
      lines.push(`      <failure message="${eMsg}"></failure>`)
      lines.push(`    </testCase>`)
    } else if (c.status === 'error') {
      const eMsg = escapeXml(c.errorMsg)
      lines.push(`    <testCase name="${eName}" duration="${c.timeMs}">`)
      lines.push(`      <error message="${eMsg}"></error>`)
      lines.push(`    </testCase>`)
    } else if (c.status === 'skipped') {
      lines.push(`    <testCase name="${eName}" duration="${c.timeMs}">`)
      lines.push(`      <skipped message="skipped"></skipped>`)
      lines.push(`    </testCase>`)
    } else {
      lines.push(`    <testCase name="${eName}" duration="${c.timeMs}"/>`)
    }
  }
  lines.push(`  </file>`)
}

lines.push('</testExecutions>')

const outputContent = lines.join('\n')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, outputContent, 'utf8')

const totalTests = results.length
const passed = results.filter(r => r.status === 'passed').length
const failed = results.filter(r => r.status === 'failure').length
const errors = results.filter(r => r.status === 'error').length
const skipped = results.filter(r => r.status === 'skipped').length

console.log('Written:', outputPath)
console.log('Files:', Object.keys(fileMap).join(', '))
console.log('Total testCases:', totalTests)
console.log('Passed:', passed, '| Failed:', failed, '| Errors:', errors, '| Skipped:', skipped)