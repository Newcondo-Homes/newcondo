import { prisma } from '@newcondo/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Count records in each table
    const userCount = await prisma.user.count()
    const propertyCount = await prisma.property.count()
    
    return NextResponse.json({
      message: 'Database connection successful!',
      counts: {
        users: userCount,
        properties: propertyCount,
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      {
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}