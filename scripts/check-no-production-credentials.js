#!/usr/bin/env node
const { execFileSync } = require('child_process')
const fs = require('fs')
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const secretPatterns = [
  new RegExp('npg' + '_[A-Za-z0-9]{8,}', 'g'),
  new RegExp('(JWT_SECRET|COOKIE_SECRET)\\s*=\\"?[a-f0-9]{48,}', 'g'),
]
const findings = []
for (const file of files) {
  const stat = fs.statSync(file)
  if (!stat.isFile() || stat.size > 2_000_000) continue
  const content = fs.readFileSync(file, 'utf8')
  if (secretPatterns.some(pattern => pattern.test(content))) findings.push(file)
  for (const pattern of secretPatterns) pattern.lastIndex = 0
}
if (findings.length > 0) {
  console.error(`Production-style database credentials found in: ${findings.join(', ')}`)
  process.exit(1)
}
console.log(`Credential scan passed (${files.length} tracked files checked).`)
