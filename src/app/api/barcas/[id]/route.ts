import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const barca = await db.barca.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          select: {
            quantityGrams: true
          }
        }
      }
    })

    if (!barca) {
      return NextResponse.json({ error: "Barca not found" }, { status: 404 })
    }

    // Calculate total ordered grams
    const totalOrderedGrams = barca.orders.reduce((sum, order) => sum + order.quantityGrams, 0)

    return NextResponse.json({
      ...barca,
      totalOrderedGrams
    })
  } catch (error) {
    console.error("Error fetching barca:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, pricePerGram, targetQuantityGrams, status } = body

    const existingBarca = await db.barca.findUnique({
      where: { id: params.id }
    })

    if (!existingBarca) {
      return NextResponse.json({ error: "Barca not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (pricePerGram !== undefined) updateData.pricePerGram = parseFloat(pricePerGram)
    if (targetQuantityGrams !== undefined) updateData.targetQuantityGrams = parseInt(targetQuantityGrams)
    if (status !== undefined) updateData.status = status

    const barca = await db.barca.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(barca)
  } catch (error) {
    console.error("Error updating barca:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingBarca = await db.barca.findUnique({
      where: { id: params.id }
    })

    if (!existingBarca) {
      return NextResponse.json({ error: "Barca not found" }, { status: 404 })
    }

    await db.barca.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Barca deleted successfully" })
  } catch (error) {
    console.error("Error deleting barca:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}