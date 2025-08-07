"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Plus, 
  Truck, 
  MapPin, 
  Calendar, 
  Users, 
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Map
} from "lucide-react"
import DeliveryMap from "@/components/map/delivery-map"

interface Delivery {
  id: string
  status: string
  deliveryDate?: string
  deliveredAt?: string
  deliveryPerson?: string
  trackingCode?: string
  notes?: string
  createdAt: string
  barge: {
    id: string
    title: string
    status: string
    product: {
      name: string
      type: string
    }
    creator: {
      name?: string
      phone: string
    }
    orders: Array<{
      id: string
      grams: number
      total: number
      user: {
        name?: string
        phone: string
      }
      address?: {
        street: string
        number: string
        neighborhood: string
        city: string
      }
    }>
  }
  deliveryRoute?: {
    id: string
    name: string
    driver?: {
      name?: string
      phone: string
    }
  }
}

interface Barge {
  id: string
  title: string
  status: string
  product: {
    name: string
    type: string
  }
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [availableBarges, setAvailableBarges] = useState<Barge[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    bargeId: "",
    deliveryDate: "",
    deliveryPerson: "",
    notes: ""
  })

  useEffect(() => {
    fetchDeliveries()
    fetchAvailableBarges()
  }, [])

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/deliveries", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDeliveries(data)
      } else {
        toast.error("Erro ao carregar entregas")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableBarges = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/barges", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filtrar barcas que podem ter entrega (CONFIRMED, PAYMENT)
        const bargesForDelivery = data.filter((barge: Barge) => 
          ['CONFIRMED', 'PAYMENT'].includes(barge.status)
        )
        setAvailableBarges(bargesForDelivery)
      }
    } catch (error) {
      console.error("Erro ao carregar barcas disponíveis:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Entrega criada com sucesso!")
        setIsDialogOpen(false)
        setFormData({ bargeId: "", deliveryDate: "", deliveryPerson: "", notes: "" })
        fetchDeliveries()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar entrega")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500"
      case "PREPARING": return "bg-blue-500"
      case "IN_TRANSIT": return "bg-purple-500"
      case "DELIVERED": return "bg-green-500"
      case "CANCELLED": return "bg-red-500"
      case "RETURNED": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "Agendado"
      case "PREPARING": return "Preparando"
      case "IN_TRANSIT": return "Em Trânsito"
      case "DELIVERED": return "Entregue"
      case "CANCELLED": return "Cancelado"
      case "RETURNED": return "Devolvido"
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="h-4 w-4" />
      case "PREPARING": return <Package className="h-4 w-4" />
      case "IN_TRANSIT": return <Truck className="h-4 w-4" />
      case "DELIVERED": return <CheckCircle className="h-4 w-4" />
      case "CANCELLED": return <AlertCircle className="h-4 w-4" />
      case "RETURNED": return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getTotalOrders = (delivery: Delivery) => {
    return delivery.barge.orders.length
  }

  const getTotalGrams = (delivery: Delivery) => {
    return delivery.barge.orders.reduce((sum, order) => sum + order.grams, 0)
  }

  const getTotalValue = (delivery: Delivery) => {
    return delivery.barge.orders.reduce((sum, order) => sum + order.total, 0)
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
          <h1 className="text-3xl font-bold tracking-tight">Entregas</h1>
          <p className="text-muted-foreground">
            Gerencie as entregas das barcas fechadas
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrega
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Entrega</DialogTitle>
              <DialogDescription>
                Selecione uma barca e configure os detalhes da entrega
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bargeId">Barca</Label>
                <Select value={formData.bargeId} onValueChange={(value) => setFormData({ ...formData, bargeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a barca" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBarges.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhuma barca disponível para entrega
                      </SelectItem>
                    ) : (
                      availableBarges.map((barge) => (
                        <SelectItem key={barge.id} value={barge.id}>
                          {barge.title} - {barge.product.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Data de Entrega</Label>
                <Input
                  id="deliveryDate"
                  type="datetime-local"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryPerson">Entregador</Label>
                <Input
                  id="deliveryPerson"
                  value={formData.deliveryPerson}
                  onChange={(e) => setFormData({ ...formData, deliveryPerson: e.target.value })}
                  placeholder="Nome do entregador"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre a entrega..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar Entrega"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveries.filter(d => d.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveries.filter(d => d.status === "IN_TRANSIT").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveries.filter(d => d.status === "DELIVERED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Map className="h-5 w-5" />
            <span>Mapa de Entregas</span>
          </CardTitle>
          <CardDescription>
            Visualização em tempo real das rotas de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeliveryMap 
            routes={deliveries.map(delivery => ({
              id: delivery.id,
              name: delivery.barge.title,
              status: delivery.status.toLowerCase() as 'planned' | 'in_progress' | 'completed',
              points: delivery.barge.orders.map(order => ({
                id: order.id,
                name: order.user.name || order.user.phone,
                address: order.address ? `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}, ${order.address.city}` : 'Endereço não informado',
                coordinates: order.address?.latitude && order.address?.longitude 
                  ? [order.address.latitude, order.address.longitude] as const
                  : [-23.5505, -46.6333] as const, // Default to São Paulo
                type: 'delivery' as const,
                status: delivery.status.toLowerCase() as 'pending' | 'in_progress' | 'completed'
              })),
              routeCoordinates: delivery.barge.orders
                .filter(order => order.address?.latitude && order.address?.longitude)
                .map(order => [order.address!.latitude, order.address!.longitude] as const),
              driver: delivery.deliveryPerson ? {
                name: delivery.deliveryPerson,
                phone: delivery.deliveryRoute?.driver?.phone || 'Não informado',
                currentLocation: [-23.5505, -46.6333] as const // Default location
              } : undefined
            }))}
            height="400px"
          />
        </CardContent>
      </Card>

      {/* Deliveries List */}
      <div className="space-y-4">
        {deliveries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma entrega encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira entrega para começar
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Criar Nova Entrega
              </Button>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{delivery.barge.title}</CardTitle>
                    <CardDescription>
                      {delivery.barge.product.name} - {delivery.barge.product.type}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(delivery.status)}>
                      {getStatusText(delivery.status)}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/deliveries/${delivery.id}`)}
                    >
                      Ver Detalhes
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
                      <span className="text-sm">Criado em:</span>
                      <span className="font-medium">
                        {new Date(delivery.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {delivery.deliveryDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Entrega:</span>
                        <span className="font-medium">
                          {new Date(delivery.deliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {delivery.deliveryPerson && (
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Entregador:</span>
                        <span className="font-medium">{delivery.deliveryPerson}</span>
                      </div>
                    )}
                    
                    {delivery.trackingCode && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Rastreio:</span>
                        <span className="font-medium">{delivery.trackingCode}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Middle Column - Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Pedidos:</span>
                      <span className="font-medium">{getTotalOrders(delivery)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total:</span>
                      <span className="font-medium">{getTotalGrams(delivery)}g</span>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Valor Total:</span>
                        <span className="font-bold text-green-600">
                          R$ {getTotalValue(delivery).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Status */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(delivery.status)}
                        <Badge className={getStatusColor(delivery.status)}>
                          {getStatusText(delivery.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    {delivery.deliveredAt && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Entregue em:</span>
                        <span className="font-medium">
                          {new Date(delivery.deliveredAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {delivery.notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Observações:</div>
                        <p className="text-sm">{delivery.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}