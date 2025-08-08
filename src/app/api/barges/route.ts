import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const barges = await db.barge.findMany({
      where: {
        status: 'active'
      },
      include: {
        bargeProducts: {
          include: {
            product: true
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
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(barges)
  } catch (error) {
    console.error('Erro ao buscar barcas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, productId, targetGrams, pricePerGram, startDate } = await request.json()

    if (!name || !productId || !targetGrams || !pricePerGram || !startDate) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Verify that the product exists
    const product = await db.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    const barge = await db.barge.create({
      data: {
        name,
        description,
        targetGrams,
        pricePerGram,
        startDate: new Date(startDate),
        bargeProducts: {
          create: {
            productId,
            isActive: true
          }
        }
      },
      include: {
        bargeProducts: {
          include: {
            product: true
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
            }
          }
        }
      }
    })

    return NextResponse.json(barge)
  } catch (error) {
    console.error('Erro ao criar barca:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}