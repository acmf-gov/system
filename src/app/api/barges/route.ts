import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const barges = await db.barge.findMany({
      where: {
        isActive: true
      },
      include: {
        product: true,
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
    const { title, description, productId, targetGrams, unitPrice, eventDate } = await request.json()

    if (!title || !productId || !targetGrams || !unitPrice || !eventDate) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    const totalValue = targetGrams * unitPrice

    const barge = await db.barge.create({
      data: {
        title,
        description,
        productId,
        targetGrams,
        unitPrice,
        totalValue,
        eventDate: new Date(eventDate)
      },
      include: {
        product: true,
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