const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:8081'
const email = process.env.SMOKE_USER_EMAIL || 'test@example.com'

async function request(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-Email': email },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${path} failed: ${response.status} ${text}`)
  }
  return response.json()
}

async function run() {
  const health = await request('/health')
  if (!health.ok) {
    throw new Error('Health check failed')
  }
  const catalogs = await request('/api/metadata/catalogs')
  if (!catalogs.catalogs || catalogs.catalogs.length === 0) {
    throw new Error('No catalogs returned')
  }
  console.log('Smoke test passed')
}

run().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
