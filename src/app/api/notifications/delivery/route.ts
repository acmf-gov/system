import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { bargeId } = await request.json()

    if (!bargeId) {
      return NextResponse.json(
        { error: 'ID da barca é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a barca e seus pedidos
    const barge = await db.barge.findUnique({
      where: { id: bargeId },
      include: {
        orders: {
          include: {
            user: true
          }
        }
      }
    })

    if (!barge) {
      return NextResponse.json(
        { error: 'Barca não encontrada' },
        { status: 404 }
      )
    }

    // Criar notificações para todos os usuários com pedidos na barca
    const notifications = await Promise.all(
      barge.orders.map(order =>
        db.notification.create({
          data: {
            title: 'Saindo para entrega! 🚚',
            message: `Sua encomenda da barca "${barge.title}" está a caminho! Fique atento para receber.`,
            type: 'DELIVERY_NOTIFICATION',
            userId: order.userId,
            bargeId: barge.id
          }
        })
      )
    )

    return NextResponse.json({
      message: 'Notificações de entrega criadas com sucesso',
      count: notifications.length
    })

  } catch (error) {
    console.error('Erro ao criar notificações de entrega:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}