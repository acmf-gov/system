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

    // Get user's referrals
    const referrals = await db.user.findMany({
      where: {
        referredById: decoded.userId
      },
      include: {
        orders: {
          select: {
            totalPrice: true,
            createdAt: true
          }
        }
      }
    })

    const totalReferrals = referrals.length
    const activeReferrals = referrals.filter(r => r.isActive).length
    
    // Calculate bonuses
    const totalBonus = referrals.reduce((sum, referral) => {
      return sum + referral.orders.reduce((orderSum, order) => orderSum + (order.totalPrice * 0.05), 0)
    }, 0)

    const pendingBonus = referrals
      .filter(r => !r.isActive)
      .reduce((sum, referral) => {
        return sum + referral.orders.reduce((orderSum, order) => orderSum + (order.totalPrice * 0.05), 0)
      }, 0)

    // Calculate conversion rate (referrals who became active)
    const conversionRate = totalReferrals > 0 ? activeReferrals / totalReferrals : 0

    return NextResponse.json({
      totalReferrals,
      activeReferrals,
      totalBonus,
      pendingBonus,
      conversionRate
    })

  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}