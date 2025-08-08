import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const barcas = await db.barca.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            quantityGrams: true
          }
        }
      }
    })

    // Transform the data to include total ordered grams
    const barcasWithTotals = barcas.map(barca => ({
      ...barca,
      totalOrderedGrams: barca.orders.reduce((sum, order) => sum + order.quantityGrams, 0)
    }))

    return NextResponse.json(barcasWithTotals)
  } catch (error) {
    console.error("Error fetching barcas:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, pricePerGram, targetQuantityGrams } = body

    if (!name || !type || !pricePerGram || !targetQuantityGrams) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const barca = await db.barca.create({
      data: {
        name,
        type,
        pricePerGram: parseFloat(pricePerGram),
        targetQuantityGrams: parseInt(targetQuantityGrams),
      }
    })

    return NextResponse.json(barca, { status: 201 })
  } catch (error) {
    console.error("Error creating barca:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}