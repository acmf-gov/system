import { Server } from 'socket.io';
import { db } from './db';

interface UserSocket {
  userId: string;
  socketId: string;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  roomId: string;
  createdAt: string;
  sender: {
    id: string;
    name?: string;
    phone: string;
  };
}

const connectedUsers = new Map<string, string>(); // userId -> socketId
const userSockets = new Map<string, string>(); // socketId -> userId

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle user authentication
    socket.on('authenticate', async (data: { token: string }) => {
      try {
        // Verify token and get user info
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${data.token}`
          }
        });

        if (response.ok) {
          const user = await response.json();
          connectedUsers.set(user.id, socket.id);
          userSockets.set(socket.id, user.id);
          
          socket.emit('authenticated', { success: true, user });
          socket.join(`user:${user.id}`);
          
          console.log(`User ${user.id} authenticated with socket ${socket.id}`);
        } else {
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      } catch (error) {
        socket.emit('authenticated', { success: false, error: 'Authentication failed' });
      }
    });

    // Handle joining chat rooms
    socket.on('join-room', (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle leaving chat rooms
    socket.on('leave-room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Handle sending messages
    socket.on('send-message', async (data: {
      text: string;
      roomId: string;
      token: string;
    }) => {
      try {
        const userId = userSockets.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Save message to database
        const message = await db.chatMessage.create({
          data: {
            message: data.text,
            userId: userId,
            roomId: data.roomId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        });

        // Broadcast message to all users in the room
        io.to(`room:${data.roomId}`).emit('new-message', message);
        
        // Send notification to room members (except sender)
        const roomMembers = await db.chatMember.findMany({
          where: {
            roomId: data.roomId,
            userId: {
              not: userId
            }
          },
          include: {
            user: true
          }
        });

        for (const member of roomMembers) {
          const memberSocketId = connectedUsers.get(member.user.id);
          if (memberSocketId) {
            io.to(memberSocketId).emit('notification', {
              type: 'new_message',
              message: `Nova mensagem em ${message.roomId}`,
              data: message
            });
          }
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      socket.to(`room:${data.roomId}`).emit('user-typing', {
        userId,
        isTyping: data.isTyping
      });
    });

    // Handle message read receipts
    socket.on('mark-read', async (data: { messageId: string }) => {
      try {
        const userId = userSockets.get(socket.id);
        if (!userId) return;

        await db.chatMessage.update({
          where: { id: data.messageId },
          data: { isRead: true }
        });

        socket.emit('message-read', { messageId: data.messageId });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle private messages
    socket.on('send-private-message', async (data: {
      text: string;
      recipientId: string;
      token: string;
    }) => {
      try {
        const senderId = userSockets.get(socket.id);
        if (!senderId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Find or create private room
        let room = await db.chatRoom.findFirst({
          where: {
            isPrivate: true,
            members: {
              every: {
                userId: {
                  in: [senderId, data.recipientId]
                }
              }
            }
          }
        });

        if (!room) {
          room = await db.chatRoom.create({
            data: {
              name: 'Private Chat',
              isPrivate: true,
              members: {
                create: [
                  { userId: senderId },
                  { userId: data.recipientId }
                ]
              }
            }
          });
        }

        // Create and save message
        const message = await db.chatMessage.create({
          data: {
            message: data.text,
            userId: senderId,
            roomId: room.id,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        });

        // Send to recipient if online
        const recipientSocketId = connectedUsers.get(data.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new-private-message', message);
        }

        // Send confirmation to sender
        socket.emit('message-sent', message);

      } catch (error) {
        console.error('Error sending private message:', error);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = userSockets.get(socket.id);
      if (userId) {
        connectedUsers.delete(userId);
        userSockets.delete(socket.id);
        console.log(`User ${userId} disconnected`);
      }
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Bem-vindo ao Chat em Tempo Real!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};