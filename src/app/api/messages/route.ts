import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { z } from "zod"
import { Server } from "socket.io"

const messageSchema = z.object({
  ciphertext: z.string(),
  nonce: z.string(),
  keys: z.array(z.object({
    userId: z.string(),
    encryptedKey: z.string()
  })),
  meta: z.object({
    senderId: z.string(),
    timestamp: z.number()
  }),
  barcaId: z.string().optional()
})

// Get Socket.IO server instance (this would be set up in your server.ts)
let io: Server | null = null

export const setSocketServer = (socketServer: Server) => {
  io = socketServer
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const barcaId = searchParams.get('barcaId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = barcaId ? { barcaId } : { barcaId: null }

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      db.message.count({ where })
    ])

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    // Verify sender ID matches session user
    if (validatedData.meta.senderId !== session.user.id) {
      return NextResponse.json({ error: "Invalid sender ID" }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        senderId: validatedData.meta.senderId,
        barcaId: validatedData.barcaId,
        ciphertext: validatedData.ciphertext,
        nonce: validatedData.nonce,
        meta: validatedData.meta
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Broadcast message via WebSocket
    if (io) {
      const room = validatedData.barcaId ? `barca-${validatedData.barcaId}` : "general"
      io.to(room).emit('new-message', message)
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}