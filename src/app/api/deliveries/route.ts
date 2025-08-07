import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const deliveries = await db.delivery.findMany({
      include: {
        barge: {
          include: {
            product: true,
            creator: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        deliveryRoute: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(deliveries)
  } catch (error) {
    console.error('Erro ao buscar entregas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bargeId, deliveryDate, deliveryPerson, notes } = await request.json()

    if (!bargeId) {
      return NextResponse.json(
        { error: 'ID da barca é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a barca existe
    const barge = await db.barge.findUnique({
      where: { id: bargeId }
    })

    if (!barge) {
      return NextResponse.json(
        { error: 'Barca não encontrada' },
        { status: 404 }
      )
    }

    // Criar entrega
    const delivery = await db.delivery.create({
      data: {
        bargeId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryPerson,
        notes
      },
      include: {
        barge: {
          include: {
            product: true,
            creator: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        deliveryRoute: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Erro ao criar entrega:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}