"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Calendar, 
  Users, 
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  Home,
  Edit,
  Navigation
} from "lucide-react"

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
        id: string
        name?: string
        phone: string
      }
      address?: {
        id: string
        street: string
        number: string
        complement?: string
        neighborhood: string
        city: string
        state: string
        zipCode: string
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

export default function DeliveryDetailPage() {
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const params = useParams()
  const router = useRouter()
  const deliveryId = params.id as string

  const [editForm, setEditForm] = useState({
    status: "",
    deliveryDate: "",
    deliveryPerson: "",
    trackingCode: "",
    notes: ""
  })

  useEffect(() => {
    if (deliveryId) {
      fetchDelivery()
    }
  }, [deliveryId])

  const fetchDelivery = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDelivery(data)
        setEditForm({
          status: data.status,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString().slice(0, 16) : "",
          deliveryPerson: data.deliveryPerson || "",
          trackingCode: data.trackingCode || "",
          notes: data.notes || ""
        })
      } else {
        toast.error("Erro ao carregar entrega")
        router.push("/dashboard/deliveries")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        toast.success("Entrega atualizada com sucesso!")
        setIsEditDialogOpen(false)
        fetchDelivery()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar entrega")
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

  const getTotalOrders = () => {
    if (!delivery) return 0
    return delivery.barge.orders.length
  }

  const getTotalGrams = () => {
    if (!delivery) return 0
    return delivery.barge.orders.reduce((sum, order) => sum + order.grams, 0)
  }

  const getTotalValue = () => {
    if (!delivery) return 0
    return delivery.barge.orders.reduce((sum, order) => sum + order.total, 0)
  }

  const getOrdersByNeighborhood = () => {
    if (!delivery) return {}
    
    const grouped = delivery.barge.orders.reduce((acc, order) => {
      if (order.address) {
        const neighborhood = order.address.neighborhood
        if (!acc[neighborhood]) {
          acc[neighborhood] = []
        }
        acc[neighborhood].push(order)
      }
      return acc
    }, {} as Record<string, typeof delivery.barge.orders>)

    return grouped
  }

  const openInMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Entrega não encontrada</h2>
        <Button onClick={() => router.push("/dashboard/deliveries")}>
          Voltar para Entregas
        </Button>
      </div>
    )
  }

  const ordersByNeighborhood = getOrdersByNeighborhood()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.push("/dashboard/deliveries")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes da Entrega</h1>
          <p className="text-muted-foreground">
            {delivery.barge.title}
          </p>
        </div>
      </div>

      {/* Header Info */}
      <Card>
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
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Editar Entrega</DialogTitle>
                    <DialogDescription>
                      Atualize as informações da entrega
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Agendado</SelectItem>
                          <SelectItem value="PREPARING">Preparando</SelectItem>
                          <SelectItem value="IN_TRANSIT">Em Trânsito</SelectItem>
                          <SelectItem value="DELIVERED">Entregue</SelectItem>
                          <SelectItem value="CANCELLED">Cancelado</SelectItem>
                          <SelectItem value="RETURNED">Devolvido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDate">Data de Entrega</Label>
                      <Input
                        id="deliveryDate"
                        type="datetime-local"
                        value={editForm.deliveryDate}
                        onChange={(e) => setEditForm({ ...editForm, deliveryDate: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deliveryPerson">Entregador</Label>
                      <Input
                        id="deliveryPerson"
                        value={editForm.deliveryPerson}
                        onChange={(e) => setEditForm({ ...editForm, deliveryPerson: e.target.value })}
                        placeholder="Nome do entregador"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="trackingCode">Código de Rastreio</Label>
                      <Input
                        id="trackingCode"
                        value={editForm.trackingCode}
                        onChange={(e) => setEditForm({ ...editForm, trackingCode: e.target.value })}
                        placeholder="Código de rastreio"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="Observações sobre a entrega..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Atualizando..." : "Atualizar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Criado:</span>
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
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pedidos:</span>
              <span className="font-medium">{getTotalOrders()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalOrders()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peso Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalGrams()}g</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {getTotalValue().toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Neighborhood */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Rota de Entrega</h2>
        
        {Object.keys(ordersByNeighborhood).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum endereço encontrado</h3>
              <p className="text-muted-foreground">
                Os pedidos não possuem endereços cadastrados
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(ordersByNeighborhood).map(([neighborhood, orders]) => (
            <Card key={neighborhood}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {neighborhood}
                </CardTitle>
                <CardDescription>
                  {orders.length} pedido(s) neste bairro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order, index) => (
                    <div key={order.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">
                            {order.user.name || order.user.phone}
                          </span>
                          <Badge variant="outline">
                            {order.grams}g - R$ {order.total.toFixed(2)}
                          </Badge>
                        </div>
                        
                        {order.address && (
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Home className="h-3 w-3" />
                              <span>{order.address.street}, {order.address.number}</span>
                              {order.address.complement && (
                                <span>- {order.address.complement}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{order.address.city} - {order.address.state}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{order.user.phone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {order.address && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInMaps(`${order.address.street}, ${order.address.number}, ${order.address.neighborhood}, ${order.address.city}, ${order.address.state}`)}
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Notes */}
      {delivery.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{delivery.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}