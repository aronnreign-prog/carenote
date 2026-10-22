import fs from 'node:fs'
import path from 'node:path'

function getApiKey() {
  if (process.env.OMNIA_API_KEY) return process.env.OMNIA_API_KEY
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const match = content.match(/OMNIA_API_KEY=["']?([^"'\r\n]+)["']?/)
      if (match && match[1]) return match[1]
    }
  } catch {}
  return process.env.OMNIA_API_KEY || ''
}

const API_KEY = getApiKey()
const BASE_URL = 'https://app.useomnia.com/api/v1'
const BRAND_ID = '5a73a250-dfea-4c64-9610-282e1a9b96c9'

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${JSON.stringify(data)}`)
  }
  return data
}

const command = process.argv[2]

async function main() {
  if (command === 'list-prompts') {
    const res = await request(`/brands/${BRAND_ID}/prompts?pageSize=100`)
    console.log(JSON.stringify(res, null, 2))
  } else if (command === 'add-prompt') {
    const query = process.argv[3]
    const type = process.argv[4] || 'Non-Branded'
    const location = process.argv[5] || 'us'
    const tag = process.argv[6] || 'BOFU'

    if (!query) {
      console.error('Usage: node scripts/omnia-cli.mjs add-prompt "<query>" [Branded|Non-Branded] [location] [tag]')
      process.exit(1)
    }

    const payload = {
      prompts: [
        {
          query,
          location,
          tags: [tag],
          topic: 'Clinical Record Synthesis',
        }
      ]
    }
    const res = await request(`/brands/${BRAND_ID}/prompts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    console.log('Prompt created successfully:')
    console.log(JSON.stringify(res, null, 2))
  } else if (command === 'brand-details') {
    const res = await request(`/brands/${BRAND_ID}`)
    console.log(JSON.stringify(res, null, 2))
  } else {
    console.log('Available commands: list-prompts, add-prompt, brand-details')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
