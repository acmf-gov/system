"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function Home() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showLogin, setShowLogin] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        
        // Redirect to dashboard
        window.location.href = "/dashboard"
      } else {
        setError(data.error || "Erro ao fazer login")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Erro ao conectar com o servidor")
    } finally {
      setIsLoading(false)
    }
  }

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">🚤 Barca Coletiva</CardTitle>
            <CardDescription>
              Sistema de compras coletivas de produtos canábicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/Usuário:</Label>
                <Input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Digite seu telefone ou usuário"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha:</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar no Sistema"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => setShowLogin(false)}
              >
                Voltar
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                Não tem uma conta?{" "}
                <a 
                  href="/register" 
                  className="text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = "/register"
                  }}
                >
                  Cadastre-se aqui
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">🚤 Barca Coletiva</CardTitle>
          <CardDescription>
            Sistema de compras coletivas de produtos canábicos
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="mb-4">Bem-vindo ao sistema!</p>
          <Button 
            className="w-full"
            onClick={() => setShowLogin(true)}
          >
            Entrar no Sistema
          </Button>
          
          <div className="text-center text-sm text-gray-600">
            Não tem uma conta?{" "}
            <a 
              href="/register" 
              className="text-blue-600 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = "/register"
              }}
            >
              Cadastre-se aqui
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}