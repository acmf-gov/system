import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    // Check if user already has a referral code
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (user?.referralCode) {
      return NextResponse.json({ 
        error: 'User already has a referral code' 
      }, { status: 400 })
    }

    // Generate unique referral code
    let referralCode = generateReferralCode()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const existingUser = await db.user.findUnique({
        where: { referralCode }
      })

      if (!existingUser) {
        break
      }

      referralCode = generateReferralCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json({ 
        error: 'Failed to generate unique referral code' 
      }, { status: 500 })
    }

    // Update user with referral code
    await db.user.update({
      where: { id: decoded.userId },
      data: { referralCode }
    })

    return NextResponse.json({ 
      referralCode,
      message: 'Referral code generated successfully' 
    })

  } catch (error) {
    console.error('Error generating referral code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}