import { supabase } from '../lib/react-native/supabase-client';

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

/**
 * ChatService
 * Real-time communication bridge between Customer and Rider.
 */
export class ChatService {
  static async sendMessage(orderId: string, message: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        order_id: orderId,
        sender_id: user.id,
        message
      });

    if (error) throw error;
  }

  static subscribeToChat(orderId: string, onMessage: (message: Message) => void) {
    return supabase
      .channel(`chat-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `order_id=eq.${orderId}` },
        (payload) => onMessage(payload.new as Message)
      )
      .subscribe();
  }

  static async getMessages(orderId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}
