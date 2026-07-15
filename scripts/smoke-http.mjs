import { spawn } from "node:child_process"

const port = 4174
const baseUrl = `http://127.0.0.1:${port}`
const server = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)],
  { stdio: ["ignore", "pipe", "pipe"], env: process.env, detached: process.platform !== "win32" },
)

let output = ""
server.stdout.on("data", (chunk) => { output += chunk.toString() })
server.stderr.on("data", (chunk) => { output += chunk.toString() })

async function waitForServer() {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`El servidor de vista previa no respondió.\n${output}`)
}

async function verifyRoute(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" })
  const html = await response.text()
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status}`)
  if (!html.includes('<div id="root"></div>')) throw new Error(`${path}: documento SPA inesperado`)
}

function stopServer() {
  if (server.killed) return
  if (process.platform !== "win32" && server.pid) {
    try { process.kill(-server.pid, "SIGTERM") } catch {}
  } else {
    server.kill("SIGTERM")
  }
}

try {
  await waitForServer()
  for (const route of ["/", "/login", "/cuenta-confirmada", "/ruta-inexistente"]) {
    await verifyRoute(route)
  }
  console.log("Pruebas HTTP de rutas públicas: OK")
} finally {
  stopServer()
}
