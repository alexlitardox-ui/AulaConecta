import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const src = path.join(root, 'src')
const sqlFiles = fs.readdirSync(root).filter((name) => /^supabase_.*\.sql$/.test(name))
const sql = sqlFiles.map((name) => fs.readFileSync(path.join(root, name), 'utf8')).join('\n')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const files = walk(src).filter((file) => /\.(js|jsx)$/.test(file))
const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n')

const tables = [...source.matchAll(/\.from\(["']([^"']+)["']\)/g)].map((m) => m[1])
const rpcs = [...source.matchAll(/\.rpc\(\s*["']([^"']+)["']/g)].map((m) => m[1])
const literalBuckets = [...source.matchAll(/storage\s*\.\s*from\(["']([^"']+)["']\)/g)].map((m) => m[1])
const constantBuckets = [...source.matchAll(/(?:BUCKET_NAME|AVATAR_BUCKET)\s*=\s*["']([^"']+)["']/g)].map((m) => m[1])
const buckets = [...literalBuckets, ...constantBuckets]

const unique = (items) => [...new Set(items)].sort()
const errors = []

for (const table of unique(tables)) {
  const mentioned = new RegExp(`public\\.${table}\\b|["']${table}["']`, 'i').test(sql)
  if (!mentioned) errors.push(`Tabla usada por React pero ausente del SQL: ${table}`)
}
for (const rpc of unique(rpcs)) {
  const defined = new RegExp(`function\\s+public\\.${rpc}\\s*\\(`, 'i').test(sql)
  if (!defined) errors.push(`RPC usada por React pero ausente del SQL: ${rpc}`)
}
for (const bucket of unique(buckets)) {
  if (!sql.includes(`'${bucket}'`)) errors.push(`Bucket usado por React pero ausente del SQL: ${bucket}`)
}

const requiredRoutes = [
  '/login', '/registro', '/restablecer-contrasena', '/dashboard',
]
const app = fs.readFileSync(path.join(src, 'App.jsx'), 'utf8')
for (const route of requiredRoutes) {
  if (!app.includes(`path="${route}"`) && route !== '/dashboard') {
    errors.push(`Ruta pública obligatoria ausente: ${route}`)
  }
}

if (errors.length) {
  console.error('\nCONTRATO FRONTEND ↔ SUPABASE: FALLÓ\n')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log('Contrato frontend ↔ Supabase: OK')
console.log(`Tablas verificadas: ${unique(tables).join(', ')}`)
console.log(`RPC verificadas: ${unique(rpcs).join(', ')}`)
console.log(`Buckets verificados: ${unique(buckets).join(', ') || 'ninguno detectado'}`)
