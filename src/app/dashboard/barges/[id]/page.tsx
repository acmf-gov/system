"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Target, 
  DollarSign, 
  Calendar,
  MapPin,
  Package,
  ShoppingCart
} from "lucide-react"

interface User {
  id: string
  phone: string
  name?: string
}

interface Address {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

interface Order {
  id: string
  grams: number
  total: number
  status: string
  notes?: string
  user: {
    name?: string
    phone: string
  }
  address?: Address
}

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
  orders: Order[]
}

export default function BargeDetailPage() {
  const [barge, setBarge] = useState<Barge | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const params = useParams()
  const router = useRouter()
  const bargeId = params.id as string

  const [orderForm, setOrderForm] = useState({
    grams: "",
    addressId: "",
    notes: ""
  })

  useEffect(() => {
    if (bargeId) {
      fetchBarge()
      fetchAddresses()
    }
  }, [bargeId])

  const fetchBarge = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/barges/${bargeId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBarge(data)
      } else {
        toast.error("Erro ao carregar barca")
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/addresses", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAddresses(data)
      }
    } catch (error) {
      console.error("Erro ao carregar endereços:", error)
    }
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/barges/${bargeId}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...orderForm,
          grams: parseInt(orderForm.grams)
        })
      })

      if (response.ok) {
        toast.success("Pedido realizado com sucesso!")
        setIsOrderDialogOpen(false)
        setOrderForm({ grams: "", addressId: "", notes: "" })
        fetchBarge()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao realizar pedido")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setIsSubmitting(false)
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

  const calculateProgress = () => {
    if (!barge) return 0
    const totalGrams = barge.orders.reduce((sum, order) => sum + order.grams, 0)
    return Math.min((totalGrams / barge.targetGrams) * 100, 100)
  }

  const getTotalGrams = () => {
    if (!barge) return 0
    return barge.orders.reduce((sum, order) => sum + order.grams, 0)
  }

  const calculateOrderTotal = () => {
    if (!barge || !orderForm.grams) return 0
    return parseInt(orderForm.grams) * barge.unitPrice
  }

  const getUserFromStorage = (): User | null => {
    const userData = localStorage.getItem("user")
    return userData ? JSON.parse(userData) : null
  }

  const getUserOrder = () => {
    if (!barge) return null
    const user = getUserFromStorage()
    return barge.orders.find(order => order.user.phone === user?.phone)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!barge) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Barca não encontrada</h2>
        <Button onClick={() => router.push("/dashboard")}>
          Voltar para o Dashboard
        </Button>
      </div>
    )
  }

  const userOrder = getUserOrder()
  const user = getUserFromStorage()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{barge.title}</h1>
          <p className="text-muted-foreground">
            {barge.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barge Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Informações da Barca</CardTitle>
                  <CardDescription>Detalhes da compra coletiva</CardDescription>
                </div>
                <Badge className={getStatusColor(barge.status)}>
                  {getStatusText(barge.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Produto</span>
                  </div>
                  <p className="text-lg">{barge.product.name} - {barge.product.type}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Preço por grama</span>
                  </div>
                  <p className="text-lg">R$ {barge.unitPrice.toFixed(2)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Meta</span>
                  </div>
                  <p className="text-lg">{barge.targetGrams}g</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Data do Evento</span>
                  </div>
                  <p className="text-lg">{new Date(barge.eventDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{getTotalGrams()}g / {barge.targetGrams}g</span>
                </div>
                <Progress value={calculateProgress()} className="h-3" />
                <div className="text-center text-sm text-muted-foreground">
                  {calculateProgress().toFixed(1)}% da meta atingida
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Total da Barca:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {barge.totalValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
              <CardDescription>
                Lista de pedidos na barca ({barge.orders.length} participantes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {barge.orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum pedido ainda. Seja o primeiro a participar!
                  </div>
                ) : (
                  barge.orders.map((order, index) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {order.user.name || order.user.phone}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.grams}g - R$ {order.total.toFixed(2)}
                          </div>
                          {order.address && (
                            <div className="text-xs text-gray-400 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {order.address.street}, {order.address.number} - {order.address.neighborhood}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={order.status === "CONFIRMED" ? "default" : "secondary"}>
                        {order.status === "CONFIRMED" ? "Confirmado" : "Pendente"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Order */}
          {userOrder ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meu Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Quantidade:</span>
                    <span className="font-medium">{userOrder.grams}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-medium">R$ {userOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={userOrder.status === "CONFIRMED" ? "default" : "secondary"}>
                      {userOrder.status === "CONFIRMED" ? "Confirmado" : "Pendente"}
                    </Badge>
                  </div>
                  {userOrder.notes && (
                    <div className="pt-2 border-t">
                      <div className="text-sm text-gray-600">Observações:</div>
                      <p className="text-sm">{userOrder.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participar da Barca</CardTitle>
                <CardDescription>
                  Faça seu pedido para participar desta compra coletiva
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={barge.status !== "ACTIVE"}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Fazer Pedido
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fazer Pedido</DialogTitle>
                      <DialogDescription>
                        Preencha as informações para participar da barca
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleOrder} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="grams">Quantidade (gramas)</Label>
                        <Input
                          id="grams"
                          type="number"
                          value={orderForm.grams}
                          onChange={(e) => setOrderForm({ ...orderForm, grams: e.target.value })}
                          placeholder="Ex: 10"
                          min="1"
                          required
                        />
                      </div>
                      
                      {orderForm.grams && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total do pedido:</span>
                            <span className="text-lg font-bold text-green-600">
                              R$ {calculateOrderTotal().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="addressId">Endereço de Entrega</Label>
                        <Select value={orderForm.addressId} onValueChange={(value) => setOrderForm({ ...orderForm, addressId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um endereço" />
                          </SelectTrigger>
                          <SelectContent>
                            {addresses.length === 0 ? (
                              <SelectItem value="" disabled>
                                Nenhum endereço cadastrado
                              </SelectItem>
                            ) : (
                              addresses.map((address) => (
                                <SelectItem key={address.id} value={address.id}>
                                  {address.street}, {address.number} - {address.neighborhood}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações (opcional)</Label>
                        <Textarea
                          id="notes"
                          value={orderForm.notes}
                          onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                          placeholder="Alguma observação sobre seu pedido..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Enviando..." : "Confirmar Pedido"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                
                {addresses.length === 0 && (
                  <div className="mt-3 text-sm text-yellow-600">
                    <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/dashboard/addresses")}>
                      Cadastre um endereço primeiro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Participantes:</span>
                  </div>
                  <span className="font-medium">{barge.orders.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total acumulado:</span>
                  </div>
                  <span className="font-medium">{getTotalGrams()}g</span>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Valor arrecadado:</span>
                  </div>
                  <span className="font-medium">
                    R$ {barge.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}