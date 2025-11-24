#!/usr/bin/env node

/**
 * Test script om een gebruiker aan te maken via de EU-CORE-BACKEND API
 * 
 * Gebruik:
 *   node scripts/create-test-user.js
 * 
 * Of vanuit browser console (op localhost:5174):
 *   fetch('http://192.168.124.50:30500/api/auth/register', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       username: 'test',
 *       email: 'test@example.com',
 *       password: 'test123'
 *     })
 *   }).then(r => r.json()).then(console.log)
 */

const API_BASE = 'http://192.168.124.50:30500/api'

const testUsers = [
  {
    username: 'dylan',
    email: 'dylan@eutype.com',
    password: 'Wachtwoord123!'
  },
  {
    username: 'test',
    email: 'test@example.com',
    password: 'test123'
  }
]

async function createUser(user) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  })

  const data = await response.json()
  
  if (response.ok) {
    console.log(`✓ Gebruiker '${user.username}' aangemaakt`)
    return data
  } else {
    console.error(`✗ Fout bij aanmaken '${user.username}':`, data.detail)
    return null
  }
}

async function main() {
  console.log('🚀 Test gebruikers aanmaken...\n')
  
  for (const user of testUsers) {
    await createUser(user)
  }
  
  console.log('\n✅ Klaar! Je kunt nu inloggen met:')
  console.log('   Username: dylan')
  console.log('   Password: Wachtwoord123!')
  console.log('\n   of')
  console.log('   Username: test')
  console.log('   Password: test123')
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createUser, testUsers }
