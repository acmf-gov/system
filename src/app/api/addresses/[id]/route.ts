import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { id } = params
    const { street, number, complement, neighborhood, city, state, zipCode } = await request.json()

    // Verificar se o endereço pertence ao usuário
    const existingAddress = await db.address.findFirst({
      where: { id, userId }
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Endereço não encontrado ou não pertence ao usuário' },
        { status: 404 }
      )
    }

    const address = await db.address.update({
      where: { id },
      data: {
        ...(street && { street }),
        ...(number && { number }),
        ...(complement !== undefined && { complement: complement || null }),
        ...(neighborhood && { neighborhood }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode })
      }
    })

    return NextResponse.json(address)
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { id } = params

    // Verificar se o endereço pertence ao usuário
    const existingAddress = await db.address.findFirst({
      where: { id, userId }
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Endereço não encontrado ou não pertence ao usuário' },
        { status: 404 }
      )
    }

    await db.address.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Endereço excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir endereço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}