import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { grams, addressId, notes } = await request.json()

    if (!grams) {
      return NextResponse.json(
        { error: 'Quantidade em gramas é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se a barca existe e está ativa
    const barge = await db.barge.findUnique({
      where: { id, isActive: true }
    })

    if (!barge) {
      return NextResponse.json(
        { error: 'Barca não encontrada ou inativa' },
        { status: 404 }
      )
    }

    // Verificar se a barca ainda aceita pedidos
    if (barge.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Esta barca não está mais aceitando pedidos' },
        { status: 400 }
      )
    }

    // Obter o usuário do token (simplificado - em produção usar JWT proper)
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

    // Verificar se o usuário já tem um pedido nesta barca
    const existingOrder = await db.order.findFirst({
      where: {
        userId,
        bargeId: id,
        status: { not: 'CANCELLED' }
      }
    })

    if (existingOrder) {
      return NextResponse.json(
        { error: 'Você já tem um pedido nesta barca' },
        { status: 400 }
      )
    }

    // Calcular o total do pedido
    const total = grams * barge.unitPrice

    // Criar o pedido
    const order = await db.order.create({
      data: {
        userId,
        bargeId: id,
        grams,
        total,
        addressId: addressId || null,
        notes: notes || null
      },
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
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const orders = await db.order.findMany({
      where: { bargeId: id },
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
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}