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

    // Get user statistics
    const [totalUsers, activeUsers, topUsers] = await Promise.all([
      db.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      db.user.count({
        where: {
          isActive: true,
          lastLoginAt: {
            gte: startDate
          }
        }
      }),
      
      db.user.findMany({
        where: {
          isActive: true,
          orders: {
            some: {
              createdAt: {
                gte: startDate
              }
            }
          }
        },
        include: {
          orders: {
            where: {
              createdAt: {
                gte: startDate
              }
            },
            select: {
              total: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          orders: {
            _count: 'desc'
          }
        },
        take: 10
      })
    ])

    // Process top users
    const processedTopUsers = topUsers.map(user => ({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      totalOrders: user.orders.length,
      totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
      lastActivity: user.lastLoginAt || user.createdAt,
      isActive: user.isActive
    }))

    return NextResponse.json({
      total: totalUsers,
      active: activeUsers,
      topUsers: processedTopUsers
    })

  } catch (error) {
    console.error('Error generating user report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}