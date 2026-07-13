import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const targets = ['app', 'components']
const translationCallTargets = ['app', 'components', 'lib', 'contexts']
const ignoredParts = [
  `${path.sep}.next${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}playwright-report${path.sep}`,
]

const visibleTextPatterns = [
  />\s*([^<>{}\n]*[A-Za-zÀ-ÿ][^<>{}\n]*)\s*</g,
  /\b(?:aria-label|placeholder|title|alt)=["']([^"']*[A-Za-zÀ-ÿ][^"']*)["']/g,
  /\btoast\.(?:success|error|info|warning)\(\s*["'`]([^"'`]*[A-Za-zÀ-ÿ][^"'`]*)["'`]/g,
]

const allowedFragments = [
  'Apple Health',
  'Body',
  'BodyOps',
  'BodyOps · v1.0',
  'BodyOps v1.0',
  'CARDIO',
  'Ops',
  'SpO₂',
  'VFC / HRV',
  'VO₂ max',
  'kg',
  'kcal',
  'm/s',
  'cm',
  'YouTube',
]

const codeLikeFragments = [
  'Promise',
  'React.RefObject',
  'new Date',
  'selected:',
  'string, map:',
  'string, namespace:',
  '${t(',
]

function walk(dir) {
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry)
    if (ignoredParts.some(part => fullPath.includes(part))) return []
    const stats = statSync(fullPath)
    if (stats.isDirectory()) return walk(fullPath)
    if (!fullPath.endsWith('.tsx')) return []
    return [fullPath]
  })
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

const findings = []

function flattenMessageKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return prefix ? [prefix] : []
  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    return flattenMessageKeys(nested, nextPrefix)
  })
}

function messageCatalogFindings() {
  const frPath = path.join(root, 'messages', 'fr.json')
  const enPath = path.join(root, 'messages', 'en.json')
  const fr = JSON.parse(readFileSync(frPath, 'utf8'))
  const en = JSON.parse(readFileSync(enPath, 'utf8'))
  const frKeys = new Set(flattenMessageKeys(fr))
  const enKeys = new Set(flattenMessageKeys(en))

  return [
    ...[...frKeys].filter(key => !enKeys.has(key)).map(key => ({ file: 'messages/en.json', line: 1, text: `Missing translation key: ${key}` })),
    ...[...enKeys].filter(key => !frKeys.has(key)).map(key => ({ file: 'messages/fr.json', line: 1, text: `Missing translation key: ${key}` })),
  ]
}

function collectMessageKeys() {
  const frPath = path.join(root, 'messages', 'fr.json')
  const enPath = path.join(root, 'messages', 'en.json')
  const fr = JSON.parse(readFileSync(frPath, 'utf8'))
  const en = JSON.parse(readFileSync(enPath, 'utf8'))
  return {
    frKeys: new Set(flattenMessageKeys(fr)),
    enKeys: new Set(flattenMessageKeys(en)),
  }
}

function walkCode(dir) {
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry)
    if (ignoredParts.some(part => fullPath.includes(part))) return []
    const stats = statSync(fullPath)
    if (stats.isDirectory()) return walkCode(fullPath)
    if (!fullPath.endsWith('.tsx') && !fullPath.endsWith('.ts')) return []
    return [fullPath]
  })
}

function translationCallFindings() {
  const { frKeys, enKeys } = collectMessageKeys()
  const callPattern = /\bt\(\s*(['"])([^'"`$]+)\1/g
  const result = []

  for (const target of translationCallTargets) {
    const targetPath = path.join(root, target)
    for (const filePath of walkCode(targetPath)) {
      const source = readFileSync(filePath, 'utf8')
      callPattern.lastIndex = 0
      let match
      while ((match = callPattern.exec(source))) {
        const key = match[2]
        if (frKeys.has(key) && enKeys.has(key)) continue
        result.push({
          file: path.relative(root, filePath),
          line: lineNumber(source, match.index),
          text: `Missing translation call key: ${key}`,
        })
      }
    }
  }

  return result
}

for (const target of targets) {
  const targetPath = path.join(root, target)
  for (const filePath of walk(targetPath)) {
    const source = readFileSync(filePath, 'utf8')
    for (const pattern of visibleTextPatterns) {
      pattern.lastIndex = 0
      let match
      while ((match = pattern.exec(source))) {
        const text = match[1].trim().replace(/\s+/g, ' ')
        if (!text) continue
        if (allowedFragments.includes(text)) continue
        if (codeLikeFragments.some(fragment => text.includes(fragment))) continue
        if (/^[):?]/.test(text)) continue
        if (/^(0|=|if\s*\()/.test(text)) continue
        if (/^[A-Z0-9_\-./:]+$/.test(text)) continue
        findings.push({
          file: path.relative(root, filePath),
          line: lineNumber(source, match.index),
          text,
        })
      }
    }
  }
}

findings.push(...messageCatalogFindings())
findings.push(...translationCallFindings())

if (findings.length > 0) {
  console.log(`i18n audit: ${findings.length} hardcoded visible string(s) found.`)
  for (const finding of findings.slice(0, 200)) {
    console.log(`${finding.file}:${finding.line} ${finding.text}`)
  }
  if (findings.length > 200) {
    console.log(`...and ${findings.length - 200} more.`)
  }
} else {
  console.log('i18n audit: no hardcoded visible strings found.')
}

if (process.argv.includes('--fail') && findings.length > 0) {
  process.exit(1)
}
