import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const files = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(full)
  }
}
walk(root)

const errors = []
const embeddedPatterns = [
  /subject\s*:\s*subjects\s*\(/,
  /profiles![a-zA-Z0-9_]+\s*\(/,
  /material\s*:\s*materials[^\n]*\(/,
  /career\s*:\s*careers\s*\(/,
  /semester\s*:\s*semesters\s*\(/,
]

for (const file of files.filter((item) => item.includes(`${path.sep}services${path.sep}`))) {
  const source = fs.readFileSync(file, 'utf8')
  for (const pattern of embeddedPatterns) {
    if (pattern.test(source)) errors.push(`${path.relative('.', file)} conserva una relación incrustada frágil: ${pattern}`)
  }
}

const appSource = fs.readFileSync(path.join(root, 'App.jsx'), 'utf8')
const requiredRoutes = [
  '/login', '/registro', '/restablecer-contrasena',
  'perfil', 'usuarios/:userId', 'tutorias', 'calendario', 'solicitudes',
  'solicitudes/nueva', 'solicitudes/mias', 'solicitudes/:requestId',
  'grupos', 'grupos/nuevo', 'grupos/mios', 'materiales', 'materiales/nuevo',
  'materiales/mios', 'materiales/favoritos', 'chat', 'reputacion', 'logros',
  'analiticas', 'asistente', 'administracion', 'notificaciones', 'configuracion',
]
for (const route of requiredRoutes) {
  if (!appSource.includes(`path=\"${route}\"`)) errors.push(`Falta la ruta ${route} en src/App.jsx`)
}

if (errors.length) {
  console.error('\nVERIFICACIÓN DE ESTABILIDAD: FALLÓ\n')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}
console.log('Verificación de estabilidad: OK')
console.log(`Servicios revisados sin relaciones incrustadas frágiles: ${files.filter((item) => item.includes(`${path.sep}services${path.sep}`)).length}`)
console.log(`Rutas esenciales verificadas: ${requiredRoutes.length}`)
