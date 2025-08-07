"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Share2, 
  Gift, 
  Users, 
  Copy, 
  DollarSign, 
  TrendingUp,
  QrCode,
  Link,
  UserPlus,
  CheckCircle,
  Clock
} from "lucide-react"

interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  totalBonus: number
  pendingBonus: number
  conversionRate: number
}

interface Referral {
  id: string
  name: string
  phone: string
  status: 'pending' | 'active' | 'completed'
  joinedAt: string
  firstOrderAt?: string
  bonusEarned: number
}

export default function ReferralsPage() {
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralCode, setReferralCode] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem("token")
      const [statsRes, referralsRes, userRes] = await Promise.all([
        fetch("/api/referrals/stats", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/referrals", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (statsRes.ok && referralsRes.ok && userRes.ok) {
        const statsData = await statsRes.json()
        const referralsData = await referralsRes.json()
        const userData = await userRes.json()

        setReferralStats(statsData)
        setReferrals(referralsData)
        setReferralCode(userData.referralCode || "")
        
        if (userData.referralCode) {
          setReferralLink(`${window.location.origin}/register?ref=${userData.referralCode}`)
        }
      }
    } catch (error) {
      console.error("Error fetching referral data:", error)
      toast.error("Erro ao carregar dados de indicação")
    } finally {
      setLoading(false)
    }
  }

  const generateReferralCode = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/referrals/generate-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setReferralCode(data.referralCode)
        setReferralLink(`${window.location.origin}/register?ref=${data.referralCode}`)
        toast.success("Código de indicação gerado com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao gerar código")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado para a área de transferência!")
  }

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Indique e Ganhe',
          text: `Use meu código de indicação ${referralCode} para se cadastrar e ganhe bônus!`,
          url: referralLink
        })
      } catch (error) {
        copyToClipboard(referralLink)
      }
    } else {
      copyToClipboard(referralLink)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'completed': return 'Concluído'
      case 'pending': return 'Pendente'
      default: return status
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Indique e Ganhe</h1>
          <p className="text-muted-foreground">
            Convide amigos e ganhe recompensas
          </p>
        </div>
        
        {!referralCode && (
          <Button onClick={generateReferralCode}>
            <Gift className="h-4 w-4 mr-2" />
            Gerar Código
          </Button>
        )}
      </div>

      {/* Referral Code Section */}
      {referralCode && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="h-5 w-5" />
              <span>Seu Código de Indicação</span>
            </CardTitle>
            <CardDescription>
              Compartilhe este código com seus amigos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Label htmlFor="referralCode">Código</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="referralCode"
                      value={referralCode}
                      readOnly
                      className="font-mono text-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(referralCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Label htmlFor="referralLink">Link de Indicação</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="referralLink"
                      value={referralLink}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(referralLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={shareReferral} className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>QR Code de Indicação</DialogTitle>
                      <DialogDescription>
                        Escaneie este QR code para acessar o link de indicação
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-6">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="w-48 h-48 bg-white rounded flex items-center justify-center">
                          <QrCode className="h-32 w-32 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">{referralLink}</p>
                      <Button onClick={() => copyToClipboard(referralLink)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {referralStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                {referralStats.activeReferrals} ativos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bônus Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(referralStats.totalBonus)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(referralStats.pendingBonus)} pendente
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(referralStats.conversionRate)}</div>
              <p className="text-xs text-muted-foreground">
                Indicações → Cadastros
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Indicações Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{referralStats.activeReferrals}</div>
              <p className="text-xs text-muted-foreground">
                Usuários ativos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {referralStats.totalReferrals - referralStats.activeReferrals}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando ativação
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Minhas Indicações</span>
          </CardTitle>
          <CardDescription>
            Histórico de indicações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma indicação ainda</h3>
              <p className="text-muted-foreground mb-4">
                Comece a compartilhar seu código para ganhar recompensas
              </p>
              {!referralCode && (
                <Button onClick={generateReferralCode}>
                  <Gift className="h-4 w-4 mr-2" />
                  Gerar Código
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{referral.name || referral.phone}</div>
                      <div className="text-sm text-gray-500">{referral.phone}</div>
                      <div className="text-xs text-gray-400">
                        Indicado em {new Date(referral.joinedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <Badge className={getStatusColor(referral.status)}>
                      {getStatusText(referral.status)}
                    </Badge>
                    <div className="text-sm font-medium">
                      {formatCurrency(referral.bonusEarned)}
                    </div>
                    {referral.firstOrderAt && (
                      <div className="text-xs text-gray-400">
                        Primeiro pedido: {new Date(referral.firstOrderAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona?</CardTitle>
          <CardDescription>
            Saiba como o sistema de indicações funciona
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Compartilhe</h3>
              <p className="text-sm text-gray-600">
                Compartilhe seu código de indicação com amigos
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Indique</h3>
              <p className="text-sm text-gray-600">
                Seu amigo se cadastra usando seu código
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Ganhe</h3>
              <p className="text-sm text-gray-600">
                Receba bônus quando seu amigo fizer pedidos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}