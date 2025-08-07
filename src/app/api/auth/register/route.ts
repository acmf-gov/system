import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { encryptUserData } from '@/lib/encryption'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Generate a unique referral code
async function generateUniqueReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  let isUnique = false
  let attempts = 0
  
  while (!isUnique && attempts < 10) {
    result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Check if code is unique
    const existingUser = await db.user.findUnique({
      where: { referralCode: result }
    })
    
    if (!existingUser) {
      isUnique = true
    }
    attempts++
  }
  
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { phone, password, name, referralCode } = await request.json()

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Telefone e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const existingUser = await db.user.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já existe com este telefone' },
        { status: 409 }
      )
    }

    // Validate referral code if provided
    let referrerUser: any = null
    if (referralCode) {
      referrerUser = await db.user.findUnique({
        where: { referralCode }
      })

      if (!referrerUser) {
        return NextResponse.json(
          { error: 'Código de indicação inválido' },
          { status: 400 }
        )
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário com dados criptografados
    const userData: any = {
      phone,
      password: hashedPassword,
      name: name || null,
      referralCode: await generateUniqueReferralCode(),
      isActive: true, // Garantir que novos usuários sejam ativos
      isVerified: false,
      isAdmin: false
    }

    // Add referral information if valid
    if (referrerUser) {
      userData.referredById = referrerUser.id
    }

    // Encrypt sensitive data before storing
    const encryptedUserData = encryptUserData(userData)

    // Remove the original phone field as it's now stored in phoneEncrypted and phoneHash
    delete encryptedUserData.phone

    const user = await db.user.create({
      data: encryptedUserData
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return decrypted data for response
    const responseData = {
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        phone: phone, // Return original phone for immediate use
        name: name,
        referredById: user.referredById
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}