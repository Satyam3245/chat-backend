import prisma from '../prisma/client.js';

const activeUsers = new Map();

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join_chat', async ({ userId, conversationId }) => {
      try {
        socket.userId = userId;
        socket.join(conversationId);
        
        activeUsers.set(userId, socket.id);
        
        io.emit('user_online', { userId });
        
        const participants = await prisma.participant.findMany({
          where: { conversationId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        });
        
        const onlineParticipants = participants.filter(p => activeUsers.has(p.userId));
        
        socket.emit('participants_list', { participants: onlineParticipants });
      } catch (error) {
        console.error('Join chat error:', error);
      }
    });
    
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, content } = data;
        
        const message = await prisma.message.create({
          data: {
            senderId,
            conversationId,
            content
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        });
        
        io.to(conversationId).emit('receive_message', message);
      } catch (error) {
        console.error('Send message error:', error);
      }
    });
    
    socket.on('typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user_typing', { userId });
    });
    
    socket.on('stop_typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user_stop_typing', { userId });
    });
    
    socket.on('message_seen', async ({ messageId, conversationId }) => {
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: { seen: true }
        });
        
        io.to(conversationId).emit('message_seen', { messageId });
      } catch (error) {
        console.error('Message seen error:', error);
      }
    });
    
    socket.on('disconnect', () => {
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        io.emit('user_offline', { userId: socket.userId });
      }
      console.log('User disconnected:', socket.id);
    });
  });
  
  return { activeUsers };
};
