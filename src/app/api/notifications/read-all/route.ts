import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const tokenData = Buffer.from(token, 'base64').toString().split(':')
    const userId = tokenData[0]

    // Marcar todas as notificações do usuário como lidas
    const result = await db.notification.updateMany({
      where: {
        OR: [
          { userId },
          { userId: null }
        ]
      },
      data: { isRead: true }
    })

    return NextResponse.json({
      message: 'Notificações marcadas como lidas',
      count: result.count
    })
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}