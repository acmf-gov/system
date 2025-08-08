"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface Barca {
  id: string
  name: string
  type: string
  pricePerGram: number
  targetQuantityGrams: number
  totalOrderedGrams: number
  status: string
}

export default function JoinBarcaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [barca, setBarca] = useState<Barca | null>(null)
  const [formData, setFormData] = useState({
    quantityGrams: "",
    clientName: session?.user?.name || "",
    phone: "",
    address: "",
    neighborhood: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingBarca, setLoadingBarca] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (params.id) {
      fetchBarca()
    }
  }, [params.id])

  useEffect(() => {
    if (session?.user?.name) {
      setFormData(prev => ({ ...prev, clientName: session.user.name }))
    }
  }, [session])

  const fetchBarca = async () => {
    try {
      const response = await fetch(`/api/barcas/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setBarca(data)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching barca:", error)
      router.push("/")
    } finally {
      setLoadingBarca(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/barcas/${params.id}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to join barca")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (status === "loading" || loadingBarca) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (!barca) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Barca não encontrada.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Voltar para o início
          </Link>
        </div>
      </div>
    )
  }

  if (barca.status !== "OPEN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Esta barca não está mais aceitando participações.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Voltar para o início
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
            <h1 className="ml-4 text-2xl font-bold text-gray-900">Participar da Barca</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Barca Info */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{barca.name}</CardTitle>
                <CardDescription>{barca.type}</CardDescription>
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
                    <span className="font-medium">
                      {Math.min((barca.totalOrderedGrams / barca.targetQuantityGrams) * 100, 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((barca.totalOrderedGrams / barca.targetQuantityGrams) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Join Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Formulário de Participação</CardTitle>
                <CardDescription>
                  Preencha suas informações para participar desta barca.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="quantityGrams">Quantidade (gramas)</Label>
                      <Input
                        id="quantityGrams"
                        type="number"
                        placeholder="100"
                        value={formData.quantityGrams}
                        onChange={(e) => handleChange("quantityGrams", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientName">Nome Completo</Label>
                      <Input
                        id="clientName"
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.clientName}
                        onChange={(e) => handleChange("clientName", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        type="text"
                        placeholder="Seu bairro"
                        value={formData.neighborhood}
                        onChange={(e) => handleChange("neighborhood", e.target.value)}
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Endereço Completo</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Rua, número, complemento"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Link href="/">
                      <Button variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Participar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}