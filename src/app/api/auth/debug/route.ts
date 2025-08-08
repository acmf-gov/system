import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decryptUserData, encrypt } from '@/lib/encryption'

interface User {
  id: string
  phone: string | null
  name: string | null
  isActive: boolean
  isAdmin: boolean
  createdAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo telefone original
    let user = await db.user.findUnique({
      where: { phone }
    })

    let encryptedPhone: string | null = null
    let userByEncryptedPhone: User | null = null

    // Tentar buscar por telefone criptografado
    if (!user) {
      try {
        encryptedPhone = encrypt(phone)
        userByEncryptedPhone = await db.user.findUnique({
          where: { phone: encryptedPhone }
        }) as User | null
      } catch (error) {
        console.error('Erro ao criptografar telefone:', error)
      }
    }

    // Buscar todos os usuários para diagnóstico (limitado a 10)
    const allUsers = await db.user.findMany({
      take: 10,
      select: {
        id: true,
        phone: true,
        name: true,
        isActive: true,
        isAdmin: true,
        createdAt: true
      }
    })

    // Tentar descriptografar os usuários para diagnóstico
    const decryptedUsers = allUsers.map(u => {
      try {
        const decrypted = decryptUserData(u)
        return {
          id: decrypted.id,
          phone: decrypted.phone || u.phone,
          name: decrypted.name || u.name,
          isActive: decrypted.isActive,
          isAdmin: decrypted.isAdmin,
          createdAt: decrypted.createdAt
        }
      } catch (error) {
        console.warn('Decryption error for user:', u.id, error)
        return {
          id: u.id,
          phone: u.phone,
          name: u.name,
          isActive: u.isActive,
          isAdmin: u.isAdmin,
          createdAt: u.createdAt,
          error: 'Failed to decrypt'
        }
      }
    })

    return NextResponse.json({
      searchPhone: phone,
      encryptedPhone: encryptedPhone,
      foundByOriginalPhone: !!user,
      foundByEncryptedPhone: !!userByEncryptedPhone,
      userByOriginalPhone: user ? {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      } : null,
      userByEncryptedPhone: userByEncryptedPhone ? {
        id: userByEncryptedPhone.id,
        phone: userByEncryptedPhone.phone,
        name: userByEncryptedPhone.name,
        isActive: userByEncryptedPhone.isActive,
        isAdmin: userByEncryptedPhone.isAdmin,
        createdAt: userByEncryptedPhone.createdAt
      } : null,
      allUsersSample: decryptedUsers,
      totalUsers: await db.user.count()
    })

  } catch (error) {
    console.error('Erro no debug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}