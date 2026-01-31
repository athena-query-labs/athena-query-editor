const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:8081'
const email = process.env.SMOKE_USER_EMAIL || 'test@example.com'
const querySql = process.env.SMOKE_QUERY || 'SELECT 1'
const cancelSql = process.env.SMOKE_CANCEL_QUERY || ''

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'X-Email': email,
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${path} failed: ${response.status} ${text}`)
  }
  return response.json()
}

async function startQuery(sql) {
  return request('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  })
}

async function pollStatus(queryId, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const status = await request(`/api/query/${queryId}`)
    if (['SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(status.state)) {
      return status
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Query ${queryId} did not finish in time`)
}

async function run() {
  const startRes = await startQuery(querySql)
  const queryId = startRes.queryId
  if (!queryId) throw new Error('Missing queryId')

  const status = await pollStatus(queryId)
  if (status.state !== 'SUCCEEDED') {
    throw new Error(`Expected SUCCEEDED, got ${status.state}`)
  }

  const results = await request(`/api/query/${queryId}/results`)
  if (!results.columns || results.columns.length === 0) {
    throw new Error('No columns returned')
  }

  const download = await request(`/api/query/${queryId}/download`)
  if (!download.available) {
    throw new Error('Download not available')
  }

  if (cancelSql) {
    const cancelStart = await startQuery(cancelSql)
    const cancelId = cancelStart.queryId
    if (!cancelId) throw new Error('Missing cancel queryId')
    await request(`/api/query/${cancelId}/cancel`, { method: 'POST' })
    const cancelStatus = await pollStatus(cancelId, 10000)
    if (cancelStatus.state !== 'CANCELLED') {
      throw new Error(`Expected CANCELLED, got ${cancelStatus.state}`)
    }
  } else {
    console.log('Cancel test skipped (SMOKE_CANCEL_QUERY not set)')
  }

  console.log('Query lifecycle test passed')
}

run().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
