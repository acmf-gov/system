import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // For now, we'll return mock chat rooms
    // In a real app, you would validate the JWT token and get the user ID
    
    const chatRooms = await db.chatRoom.findMany({
      include: {
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
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
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

    // Transform the data to match the expected format
    const transformedRooms = chatRooms.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      type: 'GROUP', // Default type
      isPrivate: room.isPrivate,
      createdAt: room.createdAt,
      creator: room.members[0]?.user || { id: '', phone: 'Unknown' },
      members: room.members,
      _count: room._count
    }))

    return NextResponse.json(transformedRooms)
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
    const { name, description, type, isPrivate } = await request.json()

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    const chatRoom = await db.chatRoom.create({
      data: {
        name,
        description,
        isPrivate: isPrivate || false
      },
      include: {
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
      }
    })

    return NextResponse.json(chatRoom)
  } catch (error) {
    console.error('Erro ao criar sala de chat:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}