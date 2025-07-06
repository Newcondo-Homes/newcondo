// Create this as test-server.ts in your combined-backend/src/ folder
import express from 'express';

const app = express();
const PORT = 3001;

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running!' 
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Test server is working!',
    port: PORT 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

// Test this first to see if basic Express works