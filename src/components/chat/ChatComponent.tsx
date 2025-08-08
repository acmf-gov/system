"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Lock } from "lucide-react"
import { cryptoManager, EncryptedMessage } from "@/lib/crypto"
import { io, Socket } from "socket.io-client"

interface Message {
  id: string
  senderId: string
  sender: {
    id: string
    name: string
  }
  ciphertext: string
  nonce: string
  meta: {
    senderId: string
    timestamp: number
  }
  createdAt: string
}

interface ChatComponentProps {
  barcaId?: string
  height?: string
}

export default function ChatComponent({ barcaId, height = "400px" }: ChatComponentProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session) {
      initializeChat()
    }
  }, [session, barcaId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      // Store public key on server if not already stored
      const publicKey = cryptoManager.getPublicKey()
      if (publicKey && session?.user?.id) {
        await cryptoManager.storePublicKeyOnServer(session.user.id, publicKey)
      }

      // Load other users' public keys
      await cryptoManager.loadUserPublicKeys()

      // Load existing messages
      await loadMessages()

      // Initialize WebSocket connection
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        path: "/api/socketio"
      })
      setSocket(socketInstance)

      socketInstance.on("connect", () => {
        console.log("Connected to chat server")
        socketInstance.emit("join-room", barcaId ? `barca-${barcaId}` : "general")
      })

      socketInstance.on("new-message", (message: Message) => {
        setMessages(prev => [...prev, message])
      })

      socketInstance.on("disconnect", () => {
        console.log("Disconnected from chat server")
      })
    } catch (error) {
      console.error("Error initializing chat:", error)
      setError("Failed to initialize chat")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages${barcaId ? `?barcaId=${barcaId}` : ''}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      setError("Failed to load messages")
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session || isSending) return

    setIsSending(true)
    setError("")

    try {
      // Get all user IDs for group encryption
      const usersResponse = await fetch("/api/users/public-keys")
      const users = await usersResponse.json()
      const userIds = users.map((user: any) => user.id)

      // Encrypt message
      const encryptedMessage = cryptoManager.encryptMessageForGroup(newMessage, userIds)
      encryptedMessage.meta.senderId = session.user.id

      // Send to server
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...encryptedMessage,
          barcaId
        }),
      })

      if (response.ok) {
        setNewMessage("")
        // The message will be added via WebSocket event
      } else {
        setError("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to encrypt and send message")
    } finally {
      setIsSending(false)
    }
  }

  const decryptMessage = (message: Message): string => {
    try {
      const encryptedMessage: EncryptedMessage = {
        ciphertext: message.ciphertext,
        nonce: message.nonce,
        keys: [], // We don't need the keys for decryption as we use the sender's public key
        meta: message.meta
      }
      return cryptoManager.decryptMessage(encryptedMessage, message.senderId)
    } catch (error) {
      console.error("Error decrypting message:", error)
      return "[Failed to decrypt message]"
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Chat {barcaId ? `da Barca` : 'Geral'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="h-4 w-4" />
          <span>Chat {barcaId ? `da Barca` : 'Geral - Uberlândia'}</span>
          <Badge variant="secondary" className="ml-auto">
            Criptografado
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-4 bg-red-50 border-b">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <ScrollArea className={`w-full ${height}`} style={{ height }}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex space-x-3 ${
                    message.senderId === session?.user?.id ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      {message.sender.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      message.senderId === session?.user?.id ? "text-right" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.sender.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.meta.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.senderId === session?.user?.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm break-words">
                        {decryptMessage(message)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" disabled={isSending || !newMessage.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}