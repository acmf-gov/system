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
    const tokenData = Buffer.from(token, 'base64').toString().split(':')
    const userId = tokenData[0]

    const rooms = await db.chatRoom.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Erro ao buscar salas de chat:', error)
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
    const tokenData = Buffer.from(token, 'base64').toString().split(':')
    const userId = tokenData[0]

    const { name, description, type, isPrivate, maxMembers } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da sala é obrigatório' },
        { status: 400 }
      )
    }

    const room = await db.chatRoom.create({
      data: {
        name,
        description,
        type: type || 'GROUP',
        isPrivate: isPrivate || false,
        maxMembers,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        members: {
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

    // Adicionar o criador como membro da sala
    await db.chatMembership.create({
      data: {
        roomId: room.id,
        userId,
        role: 'OWNER'
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Erro ao criar sala de chat:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}