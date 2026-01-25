import { blink } from '../lib/blink';

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

/**
 * ChatService
 * Real-time communication bridge between Customer and Rider.
 * Powered by Blink SDK.
 */
export class ChatService {
  static async sendMessage(orderId: string, message: string) {
    const user = await blink.auth.me();
    if (!user) throw new Error("Not authenticated");

    const newMessage = await blink.db.chatMessages.create({
      orderId,
      senderId: user.id,
      message
    });

    await blink.realtime.publish(`chat-${orderId}`, 'new_message', newMessage);
    return newMessage;
  }

  static subscribeToChat(orderId: string, onMessage: (message: Message) => void) {
    return blink.realtime.subscribe(`chat-${orderId}`, (msg) => {
      if (msg.type === 'new_message') {
        onMessage(msg.data as Message);
      }
    });
  }

  static async getMessages(orderId: string) {
    const messages = await blink.db.chatMessages.list({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    });
    return messages as any as Message[];
  }
}
