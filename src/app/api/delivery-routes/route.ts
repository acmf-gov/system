import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const routes = await db.deliveryRoute.findMany({
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        barges: {
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
        deliveries: {
          include: {
            barge: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(routes)
  } catch (error) {
    console.error('Erro ao buscar rotas de entrega:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, driverId, vehicleInfo, estimatedTime } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da rota é obrigatório' },
        { status: 400 }
      )
    }

    const route = await db.deliveryRoute.create({
      data: {
        name,
        description: description || null,
        driverId: driverId || null,
        vehicleInfo: vehicleInfo || null,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        barges: {
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
        deliveries: {
          include: {
            barge: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(route)
  } catch (error) {
    console.error('Erro ao criar rota de entrega:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}