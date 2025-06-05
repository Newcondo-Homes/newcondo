import { prisma } from '@newcondo/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
