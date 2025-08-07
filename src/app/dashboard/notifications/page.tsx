"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Truck,
  Package,
  Calendar,
  Users,
  X
} from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  barge?: {
    id: string
    title: string
    status: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      } else {
        toast.error("Erro ao carregar notificações")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: true })
      })

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ))
      }
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token")
      const unreadNotifications = notifications.filter(n => !n.isRead)
      
      for (const notification of unreadNotifications) {
        await fetch(`/api/notifications/${notification.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isRead: true })
        })
      }
      
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      toast.success("Todas as notificações marcadas como lidas")
    } catch (error) {
      toast.error("Erro ao marcar notificações como lidas")
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notificationId))
        toast.success("Notificação excluída")
      }
    } catch (error) {
      toast.error("Erro ao excluir notificação")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PAYMENT_REMINDER": return <DollarSign className="h-5 w-5" />
      case "DELIVERY_NOTIFICATION": return <Truck className="h-5 w-5" />
      case "BARGE_COMPLETED": return <CheckCircle className="h-5 w-5" />
      case "BARGE_CANCELLED": return <AlertCircle className="h-5 w-5" />
      case "ORDER_CONFIRMED": return <Package className="h-5 w-5" />
      case "ORDER_CANCELLED": return <X className="h-5 w-5" />
      case "DELIVERY_OUT_FOR_DELIVERY": return <Truck className="h-5 w-5" />
      case "DELIVERY_DELIVERED": return <CheckCircle className="h-5 w-5" />
      case "BARGE_STARTING": return <Calendar className="h-5 w-5" />
      case "NEW_MESSAGE": return <Users className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PAYMENT_REMINDER": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "DELIVERY_NOTIFICATION": return "bg-blue-100 text-blue-800 border-blue-200"
      case "BARGE_COMPLETED": return "bg-green-100 text-green-800 border-green-200"
      case "BARGE_CANCELLED": return "bg-red-100 text-red-800 border-red-200"
      case "ORDER_CONFIRMED": return "bg-green-100 text-green-800 border-green-200"
      case "ORDER_CANCELLED": return "bg-red-100 text-red-800 border-red-200"
      case "DELIVERY_OUT_FOR_DELIVERY": return "bg-purple-100 text-purple-800 border-purple-200"
      case "DELIVERY_DELIVERED": return "bg-green-100 text-green-800 border-green-200"
      case "BARGE_STARTING": return "bg-blue-100 text-blue-800 border-blue-200"
      case "NEW_MESSAGE": return "bg-indigo-100 text-indigo-800 border-indigo-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "PAYMENT_REMINDER": return "Lembrete de Pagamento"
      case "DELIVERY_NOTIFICATION": return "Notificação de Entrega"
      case "BARGE_COMPLETED": return "Barca Concluída"
      case "BARGE_CANCELLED": return "Barca Cancelada"
      case "ORDER_CONFIRMED": return "Pedido Confirmado"
      case "ORDER_CANCELLED": return "Pedido Cancelado"
      case "DELIVERY_OUT_FOR_DELIVERY": return "Saiu para Entrega"
      case "DELIVERY_DELIVERED": return "Entregue"
      case "BARGE_STARTING": return "Barca Iniciada"
      case "NEW_MESSAGE": return "Nova Mensagem"
      default: return "Geral"
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

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
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
            <p className="text-muted-foreground">
              Acompanhe todas as atualizações do sistema
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Notificações</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type.includes('PAYMENT')).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type.includes('DELIVERY')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
              <p className="text-muted-foreground">
                Você não tem notificações no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 ${
                !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-full ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{notification.title}</h3>
                        {!notification.isRead && (
                          <Badge className="bg-blue-500 text-white">Nova</Badge>
                        )}
                        <Badge variant="outline" className={getTypeColor(notification.type)}>
                          {getTypeText(notification.type)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{notification.message}</p>
                      
                      {notification.barge && (
                        <div className="text-sm text-gray-500 mb-2">
                          Barca: {notification.barge.title}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-400">
                        {new Date(notification.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
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