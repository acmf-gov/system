"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, MessageCircle, LogOut } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import ChatComponent from "@/components/chat/ChatComponent"

interface Barca {
  id: string
  name: string
  type: string
  pricePerGram: number
  targetQuantityGrams: number
  totalOrderedGrams: number
  status: "OPEN" | "CLOSED" | "COMPLETED"
  createdAt: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [barcas, setBarcas] = useState<Barca[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchBarcas()
    }
  }, [session])

  const fetchBarcas = async () => {
    try {
      const response = await fetch("/api/barcas")
      if (response.ok) {
        const data = await response.json()
        setBarcas(data)
      }
    } catch (error) {
      console.error("Error fetching barcas:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800"
      case "CLOSED":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressPercentage = (barca: Barca) => {
    return Math.min((barca.totalOrderedGrams / barca.targetQuantityGrams) * 100, 100)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Barcas</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Bem-vindo, {session.user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="barcas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="barcas" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Barcas</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            {session.user.isAdmin && (
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="barcas" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Barcas Disponíveis</h2>
              {session.user.isAdmin && (
                <Link href="/barcas/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Barca
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {barcas.map((barca) => (
                <Card key={barca.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{barca.name}</CardTitle>
                        <CardDescription>{barca.type}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(barca.status)}>
                        {barca.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Preço por grama:</span>
                        <span className="font-medium">R$ {barca.pricePerGram.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Meta:</span>
                        <span className="font-medium">{barca.targetQuantityGrams}g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total pedido:</span>
                        <span className="font-medium">{barca.totalOrderedGrams}g</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso:</span>
                        <span className="font-medium">{getProgressPercentage(barca).toFixed(1)}%</span>
                      </div>
                      <Progress value={getProgressPercentage(barca)} className="h-2" />
                    </div>

                    {session.user.isAdmin ? (
                      <div className="flex space-x-2">
                        <Link href={`/barcas/${barca.id}/edit`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/barcas/${barca.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    ) : (
                      <Link href={`/barcas/${barca.id}/join`} className="w-full">
                        <Button className="w-full">
                          Participar
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {barcas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma barca disponível no momento.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <ChatComponent height="500px" />
          </TabsContent>

          {session.user.isAdmin && (
            <TabsContent value="admin">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Painel Administrativo</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Barcas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{barcas.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Barcas Abertas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {barcas.filter(b => b.status === "OPEN").length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Barcas Concluídas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {barcas.filter(b => b.status === "COMPLETED").length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total em Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {barcas.reduce((sum, barca) => sum + barca.totalOrderedGrams, 0)}g
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}