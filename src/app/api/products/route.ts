import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, type, pricePerGram, stock } = await request.json()

    if (!name || !type || !pricePerGram) {
      return NextResponse.json(
        { error: 'Nome, tipo e preço por grama são obrigatórios' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        type,
        pricePerGram,
        stock: stock || 0
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}