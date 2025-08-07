import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    // Check if user is admin
    const currentUser = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get all data for export
    const [users, barges, orders, deliveries] = await Promise.all([
      db.user.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true
        }
      }),
      
      db.barge.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          product: true,
          creator: {
            select: {
              name: true,
              phone: true
            }
          }
        }
      }),
      
      db.order.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          user: {
            select: {
              name: true,
              phone: true
            }
          },
          barge: {
            include: {
              product: true
            }
          },
          address: true
        }
      }),
      
      db.delivery.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          barge: {
            include: {
              product: true
            }
          }
        }
      })
    ])

    if (format === 'csv') {
      // Generate CSV content
      const csvContent = generateCSV(users, barges, orders, deliveries)
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio-${range}.csv"`
        }
      })
    } else {
      // For PDF, we'll return JSON that can be used to generate PDF on client side
      return NextResponse.json({
        users,
        barges,
        orders,
        deliveries,
        generatedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateCSV(users: any[], barges: any[], orders: any[], deliveries: any[]) {
  const lines = []
  
  // Users section
  lines.push('RELATÓRIO DE USUÁRIOS')
  lines.push('ID,Telefone,Nome,Email,Ativo,Criado em,Último Login')
  users.forEach(user => {
    lines.push([
      user.id,
      user.phone,
      user.name || '',
      user.email || '',
      user.isActive ? 'Sim' : 'Não',
      new Date(user.createdAt).toLocaleDateString('pt-BR'),
      user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : ''
    ].join(','))
  })
  
  lines.push('') // Empty line
  
  // Barges section
  lines.push('RELATÓRIO DE BARCAS')
  lines.push('ID,Título,Status,Produto,Tipo,Criador,Criado em')
  barges.forEach(barge => {
    lines.push([
      barge.id,
      barge.title,
      barge.status,
      barge.product.name,
      barge.product.type,
      barge.creator.name || barge.creator.phone,
      new Date(barge.createdAt).toLocaleDateString('pt-BR')
    ].join(','))
  })
  
  lines.push('') // Empty line
  
  // Orders section
  lines.push('RELATÓRIO DE PEDIDOS')
  lines.push('ID,Usuário,Produto,Gramas,Total,Status,Criado em')
  orders.forEach(order => {
    lines.push([
      order.id,
      order.user.name || order.user.phone,
      `${order.barge.product.name} (${order.barge.product.type})`,
      order.grams,
      order.total,
      order.status,
      new Date(order.createdAt).toLocaleDateString('pt-BR')
    ].join(','))
  })
  
  lines.push('') // Empty line
  
  // Deliveries section
  lines.push('RELATÓRIO DE ENTREGAS')
  lines.push('ID,Barca,Status,Entregador,Criado em,Entregue em')
  deliveries.forEach(delivery => {
    lines.push([
      delivery.id,
      delivery.barge.title,
      delivery.status,
      delivery.deliveryPerson || '',
      new Date(delivery.createdAt).toLocaleDateString('pt-BR'),
      delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString('pt-BR') : ''
    ].join(','))
  })
  
  return lines.join('\n')
}