"use client"

import { useState } from 'react'

interface DbSuccessResponse {
  status: string;
  message: string;
  // Add other properties based on what your /api/test-db actually returns on success // Allow for dynamic properties if necessary, but try to be specific
}

interface DbErrorResponse {
  error: string;
}

// dbResult can be either a success response, an error response, or null initially
type DbResultType = DbSuccessResponse | DbErrorResponse | null;

export default function TestPage() {
  const [dbResult, setDbResult] = useState<DbResultType>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      setDbResult(data)
    } catch (error) {
      console.error("Database test failed:", error);
      setDbResult({ error: 'Failed to fetch' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>NewCondo Platform - Database Test</h1>
      
      <button 
        onClick={testDatabase} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </button>

      {dbResult && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f5f5f5',
          borderRadius: '5px',
          fontFamily: 'monospace'
        }}>
          <pre>{JSON.stringify(dbResult, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}