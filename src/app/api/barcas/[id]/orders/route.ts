import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { z } from "zod"

const orderSchema = z.object({
  quantityGrams: z.string().min(1, "Quantity is required"),
  clientName: z.string().min(1, "Client name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  neighborhood: z.string().min(1, "Neighborhood is required"),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = orderSchema.parse(body)

    // Check if barca exists and is open
    const barca = await db.barca.findUnique({
      where: { id: params.id }
    })

    if (!barca) {
      return NextResponse.json({ error: "Barca not found" }, { status: 404 })
    }

    if (barca.status !== "OPEN") {
      return NextResponse.json({ error: "Barca is not open for participation" }, { status: 400 })
    }

    // Create order and update barca total in a transaction
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          barcaId: params.id,
          userId: session.user.id,
          quantityGrams: parseInt(validatedData.quantityGrams),
          clientName: validatedData.clientName,
          phone: validatedData.phone,
          address: validatedData.address,
          neighborhood: validatedData.neighborhood,
        }
      })

      // Update barca total ordered grams
      await tx.barca.update({
        where: { id: params.id },
        data: {
          totalOrderedGrams: {
            increment: parseInt(validatedData.quantityGrams)
          }
        }
      })

      return order
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}