"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck
} from "lucide-react"

interface ReportData {
  totalUsers: number
  activeUsers: number
  totalBarges: number
  completedBarges: number
  totalRevenue: number
  totalGrams: number
  averageOrderValue: number
  conversionRate: number
}

interface MonthlyStats {
  month: string
  users: number
  barges: number
  revenue: number
  grams: number
}

interface TopProduct {
  name: string
  type: string
  totalGrams: number
  totalRevenue: number
  orders: number
}

interface UserActivity {
  userId: string
  name: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastActivity: string
  isActive: boolean
}

interface DeliveryPerformance {
  onTime: number
  delayed: number
  cancelled: number
  averageDeliveryTime: number
  totalDeliveries: number
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [deliveryPerformance, setDeliveryPerformance] = useState<DeliveryPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      // Fetch various report data
      const [usersRes, bargesRes, ordersRes, deliveriesRes] = await Promise.all([
        fetch(`/api/reports/users?range=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/reports/barges?range=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/reports/orders?range=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/reports/deliveries?range=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (usersRes.ok && bargesRes.ok && ordersRes.ok && deliveriesRes.ok) {
        const usersData = await usersRes.json()
        const bargesData = await bargesRes.json()
        const ordersData = await ordersRes.json()
        const deliveriesData = await deliveriesRes.json()

        // Process and combine data
        setReportData({
          totalUsers: usersData.total,
          activeUsers: usersData.active,
          totalBarges: bargesData.total,
          completedBarges: bargesData.completed,
          totalRevenue: ordersData.totalRevenue,
          totalGrams: ordersData.totalGrams,
          averageOrderValue: ordersData.averageOrderValue,
          conversionRate: ordersData.conversionRate
        })

        setMonthlyStats(ordersData.monthly || [])
        setTopProducts(ordersData.topProducts || [])
        setUserActivity(usersData.topUsers || [])
        setDeliveryPerformance(deliveriesData.performance)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExportLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/reports/export?format=${format}&range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-${dateRange}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting report:", error)
    } finally {
      setExportLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatGrams = (value: number) => {
    return `${value.toLocaleString('pt-BR')}g`
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e Estatísticas</h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              disabled={exportLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf')}
              disabled={exportLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Média: {formatCurrency(reportData.averageOrderValue)} por pedido
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Total: {reportData.totalUsers} usuários
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barcas Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.completedBarges}</div>
              <p className="text-xs text-muted-foreground">
                Total: {reportData.totalBarges} barcas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatGrams(reportData.totalGrams)}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de conversão: {formatPercentage(reportData.conversionRate)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Tendências Mensais</span>
              </CardTitle>
              <CardDescription>
                Evolução das métricas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyStats.map((stat, index) => (
                  <div key={stat.month} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Mês</div>
                      <div className="font-medium">{stat.month}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Barcas</div>
                      <div className="font-medium">{stat.barges}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Receita</div>
                      <div className="font-medium">{formatCurrency(stat.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Volume</div>
                      <div className="font-medium">{formatGrams(stat.grams)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Produtos Mais Vendidos</span>
              </CardTitle>
              <CardDescription>
                Ranking dos produtos por volume e receita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.type}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">{formatGrams(product.totalGrams)}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(product.totalRevenue)}</div>
                      <div className="text-xs text-gray-400">{product.orders} pedidos</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Atividade dos Usuários</span>
              </CardTitle>
              <CardDescription>
                Usuários mais ativos no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {userActivity.map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                        <div>
                          <div className="font-medium">{user.name || user.phone}</div>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Última atividade: {new Date(user.lastActivity).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">{user.totalOrders} pedidos</div>
                        <div className="text-sm text-gray-500">{formatCurrency(user.totalSpent)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          {/* Delivery Performance */}
          {deliveryPerformance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Desempenho de Entregas</span>
                </CardTitle>
                <CardDescription>
                  Métricas de performance das entregas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">No Prazo</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {deliveryPerformance.onTime}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPercentage(deliveryPerformance.onTime / deliveryPerformance.totalDeliveries)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                      <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">
                        {deliveryPerformance.delayed}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPercentage(deliveryPerformance.delayed / deliveryPerformance.totalDeliveries)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {deliveryPerformance.cancelled}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPercentage(deliveryPerformance.cancelled / deliveryPerformance.totalDeliveries)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                      <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {deliveryPerformance.averageDeliveryTime}h
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Média de entrega
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}