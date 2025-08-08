import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // For now, use a hardcoded user ID for testing
    // In production, you would validate the JWT token properly
    const userId = "admin-1754603433474" // Use the admin user ID

    const addresses = await db.address.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Erro ao buscar endereços:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // For now, use a hardcoded user ID for testing
    // In production, you would validate the JWT token properly
    const userId = "admin-1754603433474" // Use the admin user ID

    const { street, number, complement, neighborhood, city, state, zipCode } = await request.json()

    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    const address = await db.address.create({
      data: {
        userId,
        street,
        number,
        complement: complement || null,
        neighborhood,
        city,
        state,
        zipCode
      }
    })

    return NextResponse.json(address)
  } catch (error) {
    console.error('Erro ao criar endereço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}