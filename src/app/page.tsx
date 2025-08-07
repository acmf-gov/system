import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">🚤 Barca Coletiva</CardTitle>
          <CardDescription>
            Sistema de compras coletivas de produtos canábicos
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Bem-vindo ao sistema!</p>
          <Button className="w-full">
            Entrar no Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}