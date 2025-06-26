import app from './app'
import { prisma } from '@newcondo/db'
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config();

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()