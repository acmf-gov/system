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
      select: {
        id: true,
        phone: true,
        name: true,
        createdAt: true,
        isActive: true,
        orders: {
          select: {
            createdAt: true,
            totalPrice: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Process referrals data
    const processedReferrals = referrals.map(referral => {
      const firstOrder = referral.orders[0]
      return {
        id: referral.id,
        name: referral.name,
        phone: referral.phone,
        status: referral.isActive ? (firstOrder ? 'completed' : 'active') : 'pending',
        joinedAt: referral.createdAt,
        firstOrderAt: firstOrder?.createdAt,
        bonusEarned: referral.orders.reduce((sum, order) => sum + (order.totalPrice * 0.05), 0) // 5% bonus
      }
    })

    return NextResponse.json(processedReferrals)

  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}