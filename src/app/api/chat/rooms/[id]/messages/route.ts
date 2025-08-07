import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    // Check if user is member of the room
    const roomMember = await db.chatRoomMember.findUnique({
      where: {
        userId_roomId: {
          userId: decoded.userId,
          roomId: params.id
        }
      }
    })

    if (!roomMember) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    const messages = await db.chatMessage.findMany({
      where: { roomId: params.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }

    // Check if user is member of the room
    const roomMember = await db.chatRoomMember.findUnique({
      where: {
        userId_roomId: {
          userId: decoded.userId,
          roomId: params.id
        }
      }
    })

    if (!roomMember) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    const message = await db.chatMessage.create({
      data: {
        text,
        senderId: decoded.userId,
        roomId: params.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}