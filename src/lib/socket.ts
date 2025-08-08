import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle joining rooms
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    // Handle leaving rooms
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    // Handle new messages
    socket.on('new-message', (data: { 
      message: any; 
      room: string; 
      senderId: string 
    }) => {
      // Broadcast the message to all clients in the room except the sender
      socket.to(data.room).emit('new-message', data.message);
      console.log(`Message broadcasted to room ${data.room}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Chat Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};