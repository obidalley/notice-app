import { database } from '@/config/firebase';
import { ChatMessage, ChatRoom } from '@/types';
import { get, push, ref, set, update } from 'firebase/database';

class ChatService {
    private roomsRef = ref(database, 'chatRooms');
    //private messagesRef = ref(database, 'chatMessages');

    async getChatRooms(userId: string): Promise<ChatRoom[]> {
        try {
            const snapshot = await get(this.roomsRef);
            if (snapshot.exists()) {
                const rooms: ChatRoom[] = Object.values(snapshot.val());
                return rooms.filter((room: ChatRoom) => room.members.includes(userId));
            }
            // Return mock rooms if none exist in the database
            return this.getMockRooms();
        } catch (error) {
            console.error('Error getting chat rooms:', error);
            return [];
        }
    }

    async createChatRoom(room: Omit<ChatRoom, 'id' | 'createdAt'>): Promise<ChatRoom> {
        try {
            const newRoom: ChatRoom = {
                ...room,
                id: `room-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };

            const newRoomRef = push(this.roomsRef); // Generate a unique key for the new room
            await set(newRoomRef, newRoom);

            return newRoom;
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    }

    async getMessages(roomId: string): Promise<ChatMessage[]> {
        try {
            const messagesRef = ref(database, `chatMessages/${roomId}`);
            const snapshot = await get(messagesRef);
            if (snapshot.exists()) {
                return Object.values(snapshot.val());
            }
            return [];
        } catch (error) {
            console.error('Error getting messages:', error);
            return [];
        }
    }

    async sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
        try {
            const newMessage: ChatMessage = {
                ...message,
                id: `msg-${Date.now()}`,
                timestamp: new Date().toISOString(),
            };

            const messagesRef = ref(database, `chatMessages/${message.roomId}`);
            const newMessageRef = push(messagesRef); // Generate a unique key for the new message
            await set(newMessageRef, newMessage);

            // Update room's last message
            await this.updateRoomLastMessage(message.roomId, newMessage);

            return newMessage;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    private async updateRoomLastMessage(roomId: string, message: ChatMessage): Promise<void> {
        try {
            const roomRef = ref(database, `chatRooms/${roomId}`);
            const snapshot = await get(roomRef);

            if (snapshot.exists()) {
                await update(roomRef, {
                    lastMessage: message,
                    lastMessageTime: message.timestamp,
                });
            }
        } catch (error) {
            console.error('Error updating room last message:', error);
        }
    }

    private getMockRooms(): ChatRoom[] {
        return [
            {
                id: 'room-1',
                name: 'Community General',
                type: 'group',
                members: ['mock-user-1', 'user-1', 'user-2'],
                createdAt: new Date().toISOString(),
                createdBy: 'user-1',
            },
            {
                id: 'room-2',
                name: 'Emergency Alerts',
                type: 'group',
                members: ['mock-user-1', 'user-1', 'user-2', 'user-3'],
                createdAt: new Date().toISOString(),
                createdBy: 'user-1',
            },
        ];
    }
}

export const chatService = new ChatService();