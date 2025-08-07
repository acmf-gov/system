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

    // Get order statistics
    const orders = await db.order.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        barge: {
          include: {
            bargeProducts: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0)
    const totalGrams = orders.reduce((sum, order) => sum + order.totalGrams, 0)
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
    
    // Calculate conversion rate (orders per user)
    const uniqueUsers = new Set(orders.map(order => order.userId)).size
    const totalUsers = await db.user.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })
    const conversionRate = totalUsers > 0 ? uniqueUsers / totalUsers : 0

    // Group by month for trends
    const monthlyStats = {}
    orders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          month,
          users: 0,
          barges: 0,
          revenue: 0,
          grams: 0
        }
      }
      monthlyStats[month].revenue += order.totalPrice
      monthlyStats[month].grams += order.totalGrams
      monthlyStats[month].users = new Set([...(monthlyStats[month].usersSet || []), order.userId]).size
      monthlyStats[month].barges = new Set([...(monthlyStats[month].bargesSet || []), order.bargeId]).size
    })

    // Get top products
    const productStats = {}
    orders.forEach(order => {
      const firstProduct = order.barge.bargeProducts?.[0]?.product
      if (!firstProduct) return
      
      const key = `${firstProduct.name}-${firstProduct.type}`
      
      if (!productStats[key]) {
        productStats[key] = {
          name: firstProduct.name,
          type: firstProduct.type,
          totalGrams: 0,
          totalRevenue: 0,
          orders: 0
        }
      }
      
      productStats[key].totalGrams += order.totalGrams
      productStats[key].totalRevenue += order.totalPrice
      productStats[key].orders += 1
    })

    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.totalGrams - a.totalGrams)
      .slice(0, 10)

    return NextResponse.json({
      totalRevenue,
      totalGrams,
      averageOrderValue,
      conversionRate,
      monthly: Object.values(monthlyStats),
      topProducts
    })

  } catch (error) {
    console.error('Error generating order report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}