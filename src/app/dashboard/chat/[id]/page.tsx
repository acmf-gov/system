"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  Send, 
  ArrowLeft, 
  Users, 
  Settings, 
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  ThumbsUp
} from "lucide-react"
import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  text: string
  senderId: string
  roomId: string
  createdAt: string
  isRead?: boolean
  sender: {
    id: string
    name?: string
    phone: string
    avatar?: string
  }
}

interface ChatRoom {
  id: string
  name: string
  description?: string
  type: string
  isPrivate: boolean
  avatar?: string
  createdAt: string
  creator: {
    id: string
    name?: string
    phone: string
  }
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name?: string
      phone: string
      avatar?: string
    }
  }>
}

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetchRoom()
    fetchMessages()
    setupSocket()
    
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [roomId])

  const fetchRoom = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/chat/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRoom(data)
      } else {
        toast.error("Erro ao carregar sala")
        router.push("/dashboard/chat")
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor")
      router.push("/dashboard/chat")
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupSocket = () => {
    const token = localStorage.getItem("token")
    if (!token) return

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to socket')
      newSocket.emit('authenticate', { token })
    })

    newSocket.on('authenticated', (data) => {
      if (data.success) {
        newSocket.emit('join-room', roomId)
      }
    })

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    })

    newSocket.on('user-typing', (data) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return [...prev.filter(id => id !== data.userId), data.userId]
        } else {
          return prev.filter(id => id !== data.userId)
        }
      })
    })

    newSocket.on('message-read', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, isRead: true } : msg
      ))
    })

    setSocket(newSocket)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    
    try {
      const token = localStorage.getItem("token")
      
      if (socket) {
        socket.emit('send-message', {
          text: newMessage,
          roomId: roomId,
          token: token
        })
        
        setNewMessage("")
        setIsTyping(false)
      }
    } catch (error) {
      toast.error("Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true)
      socket.emit('typing', { roomId, isTyping: true })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (socket) {
        socket.emit('typing', { roomId, isTyping: false })
      }
    }, 1000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getInitials = (name?: string, phone?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return phone ? phone.slice(-2) : '??'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Sala não encontrada</h2>
          <Button onClick={() => router.push("/dashboard/chat")}>
            Voltar para o Chat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/dashboard/chat")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={room.avatar} />
                <AvatarFallback>
                  {getInitials(room.name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">{room.name}</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Badge variant="outline" className="text-xs">
                    {room.type}
                  </Badge>
                  <span>{room.members.length} membros</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === localStorage.getItem('userId')
              const showDate = index === 0 || 
                formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt)
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-sm text-gray-500 my-4">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                      {!isCurrentUser && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={message.sender.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(message.sender.name, message.sender.phone)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">
                            {message.sender.name || message.sender.phone}
                          </span>
                        </div>
                      )}
                      
                      <div className={`rounded-lg px-3 py-2 ${
                        isCurrentUser 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.text}</p>
                        <div className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.createdAt)}
                          {message.isRead && (
                            <span className="ml-1">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {typingUsers.length > 0 && (
              <div className="text-sm text-gray-500 italic">
                {typingUsers.length === 1 ? 'Alguém está digitando...' : `${typingUsers.length} pessoas estão digitando...`}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Input */}
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              placeholder="Digite uma mensagem..."
              className="flex-1"
            />
            
            <Button type="button" variant="ghost" size="sm">
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button type="submit" disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}