#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'

// Helper to resolve OMNIA_API_KEY from environment or .env.local
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

const BASE_URL = 'https://app.useomnia.com/api/v1'

async function omniaFetch(endpoint, options = {}) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('OMNIA_API_KEY is required to communicate with Omnia.')
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }

  if (!response.ok) {
    const msg = data?.error?.description || data?.error?.message || data?.error || `HTTP ${response.status}: ${text}`
    throw new Error(`Omnia API Error: ${typeof msg === 'object' ? JSON.stringify(msg) : msg}`)
  }

  return data
}

const server = new McpServer({
  name: 'omnia-mcp',
  version: '1.0.0',
})

// 1. List Brands
server.tool(
  'omnia_list_brands',
  'List all tracked brands in your Omnia account',
  { pageSize: z.number().optional().describe('Number of items per page (default 100)') },
  async ({ pageSize = 100 }) => {
    try {
      const res = await omniaFetch(`/brands?pageSize=${pageSize}`)
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      }
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: err.message }] }
    }
  }
)

// 2. Get Brand Details
server.tool(
  'omnia_get_brand',
  'Get details of a specific brand by its UUID',
  { brandId: z.string().describe('Brand UUID') },
  async ({ brandId }) => {
    try {
      const res = await omniaFetch(`/brands/${brandId}`)
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      }
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: err.message }] }
    }
  }
)

// 3. List Prompts for Brand
server.tool(
  'omnia_list_prompts',
  'List all monitored queries/prompts for a brand along with their Share of Voice and net sentiment',
  {
    brandId: z.string().describe('Brand UUID (e.g. 5a73a250-dfea-4c64-9610-282e1a9b96c9)'),
    pageSize: z.number().optional().describe('Number of items per page (default 100)'),
  },
  async ({ brandId, pageSize = 100 }) => {
    try {
      const res = await omniaFetch(`/brands/${brandId}/prompts?pageSize=${pageSize}`)
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      }
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: err.message }] }
    }
  }
)

// 4. Create Monitored Prompt
server.tool(
  'omnia_create_prompt',
  'Add a new prompt to monitor in Omnia for a specific brand',
  {
    brandId: z.string().describe('Brand UUID'),
    query: z.string().describe('The user search prompt to track (e.g. "What is the best clinical AI for longitudinal patient records?")'),
    type: z.enum(['Branded', 'Non-Branded']).optional().describe('Branded or Non-Branded (default: Non-Branded)'),
    location: z.string().optional().describe('2-letter country code, e.g. "us", "in" (default: "us")'),
    tags: z.array(z.string()).optional().describe('Tags like ["BOFU"], ["MOFU"], ["TOFU"]'),
  },
  async ({ brandId, query, location = 'us', tags = ['BOFU'], topic = 'Clinical Record Synthesis' }) => {
    try {
      const res = await omniaFetch(`/brands/${brandId}/prompts`, {
        method: 'POST',
        body: JSON.stringify({
          prompts: [
            {
              query,
              location,
              tags,
              topic,
            }
          ]
        }),
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      }
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: err.message }] }
    }
  }
)

// 5. Get AI Answers for Prompt
server.tool(
  'omnia_get_ai_answers',
  'Get AI answers (Google AI Overviews, Perplexity, ChatGPT, Google AI Mode) for a specific prompt',
  {
    promptId: z.string().describe('Prompt UUID'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD), defaults to 30 days ago'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD), defaults to today'),
    pageSize: z.number().optional().describe('Max items (default 20)'),
  },
  async ({ promptId, startDate, endDate, pageSize = 20 }) => {
    try {
      const now = new Date()
      const end = endDate || now.toISOString().slice(0, 10)
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const start = startDate || past.toISOString().slice(0, 10)

      const res = await omniaFetch(`/prompts/${promptId}/ai-answers?startDate=${start}&endDate=${end}&pageSize=${pageSize}`)
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      }
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: err.message }] }
    }
  }
)

// 6. Get Full AI Answer Detail
server.tool(
  'omnia_get_ai_answer_detail',
  'Get the complete response text, full markdown, mentioned brands, and citations for a specific AI answer ID',
  {
    aiAnswerId: z.number().describe('Numeric ID of the AI answer (e.g. 14197679)'),
  },
  async ({ aiAnswerId }) => {
    try {
      const res = await omniaFetch(`/ai-answers/${aiAnswerId}`)
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      }
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: err.message }] }
    }
  }
)

// 7. Get Brand Visibility Aggregates
server.tool(
  'omnia_get_visibility_aggregates',
  'Get brand visibility percentage, Share of Voice, and trend metrics across engines',
  {
    brandId: z.string().describe('Brand UUID'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
  },
  async ({ brandId, startDate, endDate }) => {
    try {
      const now = new Date()
      const end = endDate || now.toISOString().slice(0, 10)
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const start = startDate || past.toISOString().slice(0, 10)

      const res = await omniaFetch(`/brands/${brandId}/visibility/aggregates?startDate=${start}&endDate=${end}`)
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      }
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: err.message }] }
    }
  }
)

// 8. Get Citations Aggregates
server.tool(
  'omnia_get_citations_aggregates',
  'Find cited domains and URLs behind AI search answers for a specific prompt',
  {
    promptId: z.string().describe('Prompt UUID'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
  },
  async ({ promptId, startDate, endDate }) => {
    try {
      const now = new Date()
      const end = endDate || now.toISOString().slice(0, 10)
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const start = startDate || past.toISOString().slice(0, 10)

      const res = await omniaFetch(`/prompts/${promptId}/citations/aggregates?startDate=${start}&endDate=${end}`)
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      }
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: err.message }] }
    }
  }
)

async function run() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[Omnia MCP] Server running on stdio')
}

run().catch((err) => {
  console.error('[Omnia MCP] Fatal error:', err)
  process.exit(1)
})
