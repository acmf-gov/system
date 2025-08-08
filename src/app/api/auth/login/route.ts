import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { decryptUserData, generateHash } from '@/lib/encryption'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Telefone e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Generate hash for phone search
    const phoneHash = generateHash(phone)

    // Buscar usuário pelo hash do telefone
    let user = await db.user.findUnique({
      where: { phoneHash }
    })

    // Se não encontrar, tentar buscar pelo telefone original (para compatibilidade)
    if (!user) {
      user = await db.user.findUnique({
        where: { phone }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Usuário inativo. Entre em contato com o suporte.' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      )
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Decrypt user data for response
    let decryptedUser
    try {
      decryptedUser = decryptUserData(user)
    } catch (error) {
      console.warn('Failed to decrypt user data, using original data')
      decryptedUser = user
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: decryptedUser.id,
        phone: decryptedUser.phone || user.phone,
        name: decryptedUser.name || user.name,
        email: decryptedUser.email || user.email,
        isAdmin: decryptedUser.isAdmin,
        isActive: decryptedUser.isActive
      }
    })

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}