"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Plus, 
  LogOut,
  Bell,
  Target,
  Truck,
  DollarSign,
  MessageSquare,
  Home,
  Menu,
  X
} from "lucide-react"

interface User {
  id: string
  phone: string
  name?: string
  email?: string
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [barges, setBarges] = useState<Barge[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/")
      return
    }

    try {
      setUser(JSON.parse(userData))
      fetchBarges()
    } catch (error) {
      router.push("/")
    }
  }, [router])

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

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
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

  const calculateProgress = (barge: Barge) => {
    const totalGrams = barge.orders.reduce((sum, order) => sum + order.grams, 0)
    return Math.min((totalGrams / barge.targetGrams) * 100, 100)
  }

  const getTotalGrams = (barge: Barge) => {
    return barge.orders.reduce((sum, order) => sum + order.grams, 0)
  }

  const navigationItems = [
    { href: "/dashboard", icon: Home, label: "Início" },
    { href: "/dashboard/barges/manage", icon: Package, label: "Barcas" },
    { href: "/dashboard/deliveries", icon: Truck, label: "Entregas" },
    { href: "/dashboard/chat", icon: MessageSquare, label: "Chat" },
    { href: "/dashboard/notifications", icon: Bell, label: "Notificações" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">🚤 Barca Coletiva</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, {user?.name || user?.phone}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(item.href)
                    setMobileMenuOpen(false)
                  }}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="text-sm text-gray-600 px-2 py-1">
                  Bem-vindo, {user?.name || user?.phone}
                </div>
                <Button variant="outline" size="sm" className="w-full justify-start mt-1" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white border-r min-h-0">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => router.push(item.href)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigationItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "default" : "ghost"}
              size="sm"
              className="flex-col h-auto py-2"
              onClick={() => router.push(item.href)}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Add padding for mobile bottom nav */}
      <div className="lg:hidden h-20"></div>
    </div>
  )
}