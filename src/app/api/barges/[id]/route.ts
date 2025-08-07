import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const barge = await db.barge.findUnique({
      where: { id },
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
            },
            address: true
          },
          orderBy: {
            createdAt: 'asc'
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

    return NextResponse.json(barge)
  } catch (error) {
    console.error('Erro ao buscar barca:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, status } = await request.json()

    const barge = await db.barge.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status })
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
    console.error('Erro ao atualizar barca:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.barge.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    return NextResponse.json({ message: 'Barca desativada com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar barca:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}