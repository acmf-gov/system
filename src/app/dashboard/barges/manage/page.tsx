"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Settings, 
  DollarSign, 
  Users, 
  Target, 
  Calendar,
  Bell,
  CheckCircle,
  Truck,
  XCircle
} from "lucide-react"

interface Barge {
  id: string
  title: string
  description?: string
  targetGrams: number
  unitPrice: number
  totalValue: number
  eventDate: string
  status: string
  product: {
    name: string
    type: string
  }
  orders: Array<{
    id: string
    grams: number
    total: number
    status: string
    user: {
      name?: string
      phone: string
    }
  }>
}

export default function ManageBargesPage() {
  const [barges, setBarges] = useState<Barge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBarge, setSelectedBarge] = useState<Barge | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const router = useRouter()

  useEffect(() => {
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

  const handleStatusChange = async () => {
    if (!selectedBarge || !newStatus) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/barges/${selectedBarge.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success("Status atualizado com sucesso!")
        setIsStatusDialogOpen(false)
        setSelectedBarge(null)
        setNewStatus("")
        fetchBarges()
        
        // Se o status for PAYMENT, criar notificações
        if (newStatus === "PAYMENT") {
          await createPaymentNotifications(selectedBarge.id)
        }
        
        // Se o status for DELIVERING, criar notificações de entrega
        if (newStatus === "DELIVERING") {
          await createDeliveryNotifications(selectedBarge.id)
        }
      } else {
        toast.error("Erro ao atualizar status")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    }
  }

  const createPaymentNotifications = async (bargeId: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch("/api/notifications/payment-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bargeId })
      })
    } catch (error) {
      console.error("Erro ao criar notificações de pagamento:", error)
    }
  }

  const createDeliveryNotifications = async (bargeId: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch("/api/notifications/delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bargeId })
      })
    } catch (error) {
      console.error("Erro ao criar notificações de entrega:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500"
      case "PAYMENT": return "bg-yellow-500"
      case "CONFIRMED": return "bg-blue-500"
      case "DELIVERING": return "bg-purple-500"
      case "COMPLETED": return "bg-gray-500"
      case "CANCELLED": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Ativa"
      case "PAYMENT": return "Aguardando Pagamento"
      case "CONFIRMED": return "Confirmada"
      case "DELIVERING": return "Saindo para Entrega"
      case "COMPLETED": return "Concluída"
      case "CANCELLED": return "Cancelada"
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Target className="h-4 w-4" />
      case "PAYMENT": return <DollarSign className="h-4 w-4" />
      case "CONFIRMED": return <CheckCircle className="h-4 w-4" />
      case "DELIVERING": return <Truck className="h-4 w-4" />
      case "COMPLETED": return <CheckCircle className="h-4 w-4" />
      case "CANCELLED": return <XCircle className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const calculateProgress = (barge: Barge) => {
    const totalGrams = barge.orders.reduce((sum, order) => sum + order.grams, 0)
    return Math.min((totalGrams / barge.targetGrams) * 100, 100)
  }

  const getTotalGrams = (barge: Barge) => {
    return barge.orders.reduce((sum, order) => sum + order.grams, 0)
  }

  const openStatusDialog = (barge: Barge) => {
    setSelectedBarge(barge)
    setNewStatus(barge.status)
    setIsStatusDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Barcas</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie todas as barcas ativas
          </p>
        </div>
        
        <Button onClick={() => router.push("/dashboard/barges/new")}>
          Nova Barca
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Barcas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barges.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barcas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {barges.filter(b => b.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {barges.filter(b => b.status === "PAYMENT").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {barges.reduce((sum, barge) => sum + barge.orders.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barges List */}
      <div className="space-y-4">
        {barges.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma barca encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira barca para começar
              </p>
              <Button onClick={() => router.push("/dashboard/barges/new")}>
                Criar Nova Barca
              </Button>
            </CardContent>
          </Card>
        ) : (
          barges.map((barge) => (
            <Card key={barge.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{barge.title}</CardTitle>
                    <CardDescription>{barge.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(barge.status)}>
                      {getStatusText(barge.status)}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openStatusDialog(barge)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column - Info */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Data:</span>
                      <span className="font-medium">
                        {new Date(barge.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Meta:</span>
                      <span className="font-medium">{barge.targetGrams}g</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Valor/g:</span>
                      <span className="font-medium">R$ {barge.unitPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Participantes:</span>
                      <span className="font-medium">{barge.orders.length}</span>
                    </div>
                  </div>
                  
                  {/* Middle Column - Progress */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progresso</span>
                        <span>{getTotalGrams(barge)}g / {barge.targetGrams}g</span>
                      </div>
                      <Progress value={calculateProgress(barge)} className="h-2" />
                      <div className="text-center text-sm text-muted-foreground mt-1">
                        {calculateProgress(barge).toFixed(1)}% completo
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Valor Total:</span>
                        <span className="font-bold text-green-600">
                          R$ {barge.totalValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Actions */}
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Arrecadado:</span>
                        <span className="font-bold text-blue-600">
                          R$ {barge.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => router.push(`/dashboard/barges/${barge.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                    
                    {barge.status === "ACTIVE" && calculateProgress(barge) >= 100 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setSelectedBarge(barge)
                          setNewStatus("PAYMENT")
                          setIsStatusDialogOpen(true)
                        }}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Solicitar Pagamentos
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da Barca</DialogTitle>
            <DialogDescription>
              Altere o status da barca "{selectedBarge?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Novo Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Ativa</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PAYMENT">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Aguardando Pagamento</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CONFIRMED">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirmada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="DELIVERING">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4" />
                      <span>Saindo para Entrega</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Concluída</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4" />
                      <span>Cancelada</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStatusChange}>
                Alterar Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}