import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { z } from "zod"

const publicKeySchema = z.object({
  publicKey: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await db.user.findMany({
      where: {
        publicKey: {
          not: null
        }
      },
      select: {
        id: true,
        publicKey: true
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching public keys:", error)
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
    const { publicKey } = publicKeySchema.parse(body)

    await db.user.update({
      where: { id: session.user.id },
      data: { publicKey }
    })

    return NextResponse.json({ message: "Public key stored successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error storing public key:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}