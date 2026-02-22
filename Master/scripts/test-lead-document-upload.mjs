#!/usr/bin/env node
/**
 * Test script for lead document upload.
 * Usage: node scripts/test-lead-document-upload.mjs [BASE_URL]
 * Default BASE_URL: http://localhost:3000
 * Requires: server running (npm run dev), and a user in DB (e.g. admin@careerist.com / password123).
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'http://localhost:3000'
const LOGIN_EMAIL = process.env.TEST_LOGIN_EMAIL || 'admin@careerist.com'
const LOGIN_PASSWORD = process.env.TEST_LOGIN_PASSWORD || 'password123'

async function request(method, path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    method,
    ...options,
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { ok: res.ok, status: res.status, body, headers: res.headers }
}

async function main() {
  console.log('Lead document upload test')
  console.log('BASE_URL:', BASE_URL)
  console.log('')

  // 1. Login
  console.log('1. Logging in...')
  const loginRes = await request('POST', '/api/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  })
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, loginRes.body)
    process.exit(1)
  }
  const token = loginRes.body?.token
  if (!token) {
    console.error('No token in response:', loginRes.body)
    process.exit(1)
  }
  console.log('   Token received')

  // 2. Create lead
  console.log('2. Creating lead...')
  const createRes = await request('POST', '/api/leads', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      companyName: 'Test Co',
      contactName: 'Test Contact',
      email: 'test@test.com',
      status: 'NEW',
    }),
  })
  if (!createRes.ok) {
    console.error('Create lead failed:', createRes.status, createRes.body)
    process.exit(1)
  }
  const leadId = createRes.body?.id
  if (!leadId) {
    console.error('No lead id in response:', createRes.body)
    process.exit(1)
  }
  console.log('   Lead ID:', leadId)

  // 3. Create a temp file and upload
  const tmpFile = join(tmpdir(), `lead-test-${Date.now()}.txt`)
  writeFileSync(tmpFile, 'Hello from lead document upload test.\n')
  console.log('3. Uploading file...')

  const fileBuffer = readFileSync(tmpFile)
  const blob = new Blob([fileBuffer], { type: 'text/plain' })
  const formData = new FormData()
  formData.append('file', blob, 'test-doc.txt')

  const uploadRes = await fetch(`${BASE_URL}/api/leads/${leadId}/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (existsSync(tmpFile)) unlinkSync(tmpFile)

  const uploadBody = await uploadRes.json().catch(() => ({}))
  if (!uploadRes.ok) {
    console.error('Upload failed:', uploadRes.status, uploadBody)
    process.exit(1)
  }
  console.log('   Upload response:', uploadBody?.id ? { id: uploadBody.id, originalFileName: uploadBody.originalFileName, fileSize: uploadBody.fileSize } : uploadBody)

  // 4. List documents
  console.log('4. Listing documents...')
  const listRes = await request('GET', `/api/leads/${leadId}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!listRes.ok) {
    console.error('List failed:', listRes.status, listRes.body)
    process.exit(1)
  }
  const list = Array.isArray(listRes.body) ? listRes.body : []
  console.log('   Documents count:', list.length)
  if (list.length === 0) {
    console.error('   Expected at least 1 document')
    process.exit(1)
  }
  console.log('   First doc:', list[0]?.originalFileName, list[0]?.fileSize, 'bytes')

  console.log('')
  console.log('All steps passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
