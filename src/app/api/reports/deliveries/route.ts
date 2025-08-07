import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    // Check if user is admin
    const currentUser = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get delivery statistics
    const deliveries = await db.delivery.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })

    const totalDeliveries = deliveries.length
    const onTime = deliveries.filter(d => d.status === 'delivered').length
    const delayed = deliveries.filter(d => d.status === 'on_the_way' && 
      new Date(d.estimatedTime || d.createdAt) < new Date()).length
    const cancelled = deliveries.filter(d => d.status === 'cancelled').length

    // Calculate average delivery time (in hours)
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered' && d.deliveredAt)
    const averageDeliveryTime = completedDeliveries.length > 0 
      ? completedDeliveries.reduce((sum, d) => {
          const deliveryTime = new Date(d.deliveredAt!).getTime() - new Date(d.createdAt).getTime()
          return sum + (deliveryTime / (1000 * 60 * 60)) // Convert to hours
        }, 0) / completedDeliveries.length
      : 0

    return NextResponse.json({
      performance: {
        onTime,
        delayed,
        cancelled,
        averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
        totalDeliveries
      }
    })

  } catch (error) {
    console.error('Error generating delivery report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}