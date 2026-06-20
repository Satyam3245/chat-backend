import prisma from '../prisma/client.js';

export const createConversation = async (req, res) => {
  try {
    const { participantIds } = req.body;
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 participants are required' });
    }
    
    if (!participantIds.includes(req.userId)) {
      return res.status(400).json({ error: 'You must be a participant in the conversation' });
    }
    
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: participantIds.map(userId => ({
            userId
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              }
            }
          }
        }
      }
    });
    
    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    res.json({ messages });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: req.userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                seen: false,
                NOT: {
                  senderId: req.userId
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ conversations });
  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { seen: true },
      include: {
        sender: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    res.json({ message });
  } catch (error) {
    console.error('Mark message as seen error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
