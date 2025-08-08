"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Plus, 
  Target,
  Truck,
  DollarSign,
  TrendingUp
} from "lucide-react"

interface Barge {
  id: string
  name: string
  description?: string
  targetGrams: number
  currentGrams: number
  pricePerGram: number
  status: string
  startDate: string
  endDate?: string
  orders: Array<{
    id: string
    totalGrams: number
    totalPrice: number
    status: string
  }>
}

export default function DashboardPage() {
  const [barges, setBarges] = useState<Barge[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchBarges()
  }, [])

  const fetchBarges = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/barges", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBarges(data)
      } else {
        toast.error("Erro ao carregar barcas")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "completed": return "bg-blue-500"
      case "cancelled": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Ativa"
      case "completed": return "Concluída"
      case "cancelled": return "Cancelada"
      default: return status
    }
  }

  const calculateProgress = (barge: Barge) => {
    return Math.min((barge.currentGrams / barge.targetGrams) * 100, 100)
  }

  const totalOrders = barges.reduce((sum, barge) => sum + barge.orders.length, 0)
  const totalGrams = barges.reduce((sum, barge) => sum + barge.currentGrams, 0)
  const activeBarges = barges.filter(b => b.status === "active").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {user?.name || user?.phone}!</h1>
          <p className="text-gray-600">Aqui está o resumo do sistema Barca Coletiva</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Barca
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Barcas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barges.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeBarges} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Gramas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGrams.toFixed(0)}g</div>
            <p className="text-xs text-muted-foreground">
              Acumulado total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <p className="text-xs text-muted-foreground">
              Sistema operacional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Barges */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Barcas Ativas</h2>
        {barges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma barca encontrada</h3>
              <p className="text-gray-600 text-center mb-4">
                Comece criando sua primeira barca para gerenciar as compras coletivas
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Barca
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {barges.map((barge) => (
              <Card key={barge.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{barge.name}</CardTitle>
                      <CardDescription>{barge.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(barge.status)}>
                      {getStatusText(barge.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Meta:</span>
                        <div className="font-medium">{barge.targetGrams}g</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Atual:</span>
                        <div className="font-medium">{barge.currentGrams}g</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Preço/g:</span>
                        <div className="font-medium">R${barge.pricePerGram.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Pedidos:</span>
                        <div className="font-medium">{barge.orders.length}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{calculateProgress(barge).toFixed(1)}%</span>
                      </div>
                      <Progress value={calculateProgress(barge)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}