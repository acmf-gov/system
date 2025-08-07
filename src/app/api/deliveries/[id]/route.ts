import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const delivery = await db.delivery.findUnique({
      where: { id },
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
            },
            orders: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true
                  }
                },
                address: true
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

    if (!delivery) {
      return NextResponse.json(
        { error: 'Entrega não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Erro ao buscar entrega:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { status, deliveryDate, deliveryPerson, trackingCode, notes } = await request.json()

    const delivery = await db.delivery.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
        ...(deliveryPerson !== undefined && { deliveryPerson }),
        ...(trackingCode !== undefined && { trackingCode }),
        ...(notes !== undefined && { notes }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date() })
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
            },
            orders: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true
                  }
                },
                address: true
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
    console.error('Erro ao atualizar entrega:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}