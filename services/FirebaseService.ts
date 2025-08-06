import { database, storage } from '@/config/firebase';
import { ChatMessage, ChatRoom, Comment, Notice, User } from '@/types';
import { get, off, onValue, push, ref, set, update } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

export class FirebaseService {
    // Notice Management
    static async createNotice(noticeData: Omit<Notice, 'id' | 'createdAt'>): Promise<Notice> {
        try {
            const noticeRef = ref(database, 'notices');
            const newNoticeRef = push(noticeRef);
            const notice: Notice = {
                ...noticeData,
                id: newNoticeRef.key!,
                createdAt: new Date().toISOString(),
                rsvpList: [],
                comments: [],
                likes: [],
            };

            await set(newNoticeRef, notice);
            return notice;
        } catch (error) {
            console.error('Error creating notice:', error);
            throw error;
        }
    }

    static async getNotices(location?: { latitude: number; longitude: number }, radius = 10): Promise<Notice[]> {
        try {
            const noticesRef = ref(database, 'notices');
            const snapshot = await get(noticesRef);
            const notices: Notice[] = [];

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const notice = childSnapshot.val() as Notice;
                    if (childSnapshot.key !== notice.id) {
                        console.warn(`ID mismatch for notice ${childSnapshot.key}: expected ${childSnapshot.key}, got ${notice.id}`);
                    }

                    if (location && notice.location) {
                        const distance = this.calculateDistance(
                            location.latitude,
                            location.longitude,
                            notice.location.latitude,
                            notice.location.longitude
                        );

                        if (distance <= radius) {
                            notices.push(notice);
                        }
                    } else {
                        notices.push(notice);
                    }
                });
            }

            return notices.reverse();
        } catch (error) {
            console.error('Error getting notices:', error);
            return [];
        }
    }

    static async addComment(noticeId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<void> {
        try {
            const commentRef = ref(database, `notices/${noticeId}/comments`);
            const newCommentRef = push(commentRef);
            const newComment: Comment = {
                ...comment,
                id: newCommentRef.key!,
                createdAt: new Date().toISOString(),
            };

            await set(newCommentRef, newComment);
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    static async toggleRSVP(noticeId: string, userId: string): Promise<void> {
        try {
            const rsvpRef = ref(database, `notices/${noticeId}/rsvpList`);
            const snapshot = await get(rsvpRef);
            const rsvpList = snapshot.val() || [];

            const index = rsvpList.indexOf(userId);
            if (index !== -1) {
                rsvpList.splice(index, 1);
            } else {
                rsvpList.push(userId);
            }

            await set(rsvpRef, rsvpList);
        } catch (error) {
            console.error('Error toggling RSVP:', error);
            throw error;
        }
    }

    static async toggleLike(noticeId: string, userId: string): Promise<void> {
        try {
            const likesRef = ref(database, `notices/${noticeId}/likes`);
            const snapshot = await get(likesRef);
            const likes = snapshot.val() || [];

            const index = likes.indexOf(userId);
            if (index !== -1) {
                likes.splice(index, 1);
            } else {
                likes.push(userId);
            }

            await set(likesRef, likes);
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }

    // Chat Management
    static async createChatRoom(roomData: Omit<ChatRoom, 'id' | 'createdAt' | 'members'>): Promise<ChatRoom> {
        try {
            const roomRef = ref(database, 'chatRooms');
            const newRoomRef = push(roomRef);
            const room: ChatRoom = {
                ...roomData,
                id: newRoomRef.key!,
                createdAt: new Date().toISOString(),
                members: [roomData.createdBy], // Add creator to members
            };

            await set(newRoomRef, room);
            return room;
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    }

    static async getChatRooms(location?: { latitude: number; longitude: number }, radius = 10): Promise<ChatRoom[]> {
        try {
            const roomsRef = ref(database, 'chatRooms');
            const snapshot = await get(roomsRef);
            const rooms: ChatRoom[] = [];

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const room = childSnapshot.val() as ChatRoom;
                    if (childSnapshot.key !== room.id) {
                        console.warn(`ID mismatch for room ${childSnapshot.key}: expected ${childSnapshot.key}, got ${room.id}`);
                    }

                    if (location && room.location) {
                        const distance = this.calculateDistance(
                            location.latitude,
                            location.longitude,
                            room.location.latitude,
                            room.location.longitude
                        );

                        if (distance <= radius) {
                            rooms.push(room);
                        }
                    } else {
                        rooms.push(room);
                    }
                });
            }

            return rooms.sort((a, b) =>
                new Date(b.lastMessageTime || b.createdAt).getTime() -
                new Date(a.lastMessageTime || a.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error getting chat rooms:', error);
            return [];
        }
    }

    static async joinChatRoom(roomId: string, userId: string): Promise<void> {
        try {
            const roomRef = ref(database, `chatRooms/${roomId}/members`);
            const snapshot = await get(roomRef);
            const members = snapshot.val() || [];
            if (!members.includes(userId)) {
                members.push(userId);
                await set(roomRef, members);
            }
        } catch (error) {
            console.error('Error joining chat room:', error);
            throw error;
        }
    }

    static async sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
        try {
            const messageRef = ref(database, `chatMessages/${message.roomId}`);
            const newMessageRef = push(messageRef);
            const newMessage: ChatMessage = {
                ...message,
                id: newMessageRef.key!,
                timestamp: new Date().toISOString(),
            };

            await set(newMessageRef, newMessage);

            await update(ref(database, `chatRooms/${message.roomId}`), {
                lastMessage: newMessage,
                lastMessageTime: newMessage.timestamp,
            });

            return newMessage;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    static async getMessages(roomId: string): Promise<ChatMessage[]> {
        try {
            const messagesRef = ref(database, `chatMessages/${roomId}`);
            const snapshot = await get(messagesRef);
            const messages: ChatMessage[] = [];

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    messages.push(childSnapshot.val() as ChatMessage);
                });
            }

            return messages;
        } catch (error) {
            console.error('Error getting messages:', error);
            return [];
        }
    }

    // Storage Management
    static async uploadImage(imageUri: string, folder = 'images'): Promise<string> {
        try {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const reference = storageRef(storage, filename);

            await uploadBytes(reference, blob);
            const downloadURL = await getDownloadURL(reference);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    // User Management
    static async createUser(userData: User): Promise<void> {
        try {
            // Create a new user object with undefined values converted to null
            const sanitizedUserData: User = {
                ...userData,
                photoURL: userData.photoURL ?? null,
                location: userData.location ?? null,
            };

            await set(ref(database, `users/${userData.id}`), sanitizedUserData);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    static async getUser(userId: string): Promise<User | null> {
        try {
            const snapshot = await get(ref(database, `users/${userId}`));
            return snapshot.val() as User | null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
        try {
            // Sanitize updates to convert undefined to null
            const sanitizedUpdates: Partial<User> = {
                ...updates,
                photoURL: updates.photoURL ?? null,
                location: updates.location ?? null,
            };

            await update(ref(database, `users/${userId}`), sanitizedUpdates);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Utility Functions
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Real-time listeners
    static subscribeToNotices(callback: (notices: Notice[]) => void, location?: { latitude: number; longitude: number }) {
        const noticesRef = ref(database, 'notices');

        const listener = onValue(noticesRef, (snapshot) => {
            const notices: Notice[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const notice = childSnapshot.val() as Notice;
                    if (childSnapshot.key !== notice.id) {
                        console.warn(`ID mismatch for notice ${childSnapshot.key}: expected ${childSnapshot.key}, got ${notice.id}`);
                    }

                    if (location && notice.location) {
                        const distance = this.calculateDistance(
                            location.latitude,
                            location.longitude,
                            notice.location.latitude,
                            notice.location.longitude
                        );

                        if (distance <= 10) {
                            notices.push(notice);
                        }
                    } else {
                        notices.push(notice);
                    }
                });
            }

            callback(notices.reverse());
        });

        return listener;
    }

    static subscribeToChatRooms(callback: (chatRooms: ChatRoom[]) => void, location?: { latitude: number; longitude: number }, radius = 10) {
        const roomsRef = ref(database, 'chatRooms');

        const listener = onValue(roomsRef, (snapshot) => {
            const rooms: ChatRoom[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const room = childSnapshot.val() as ChatRoom;
                    if (childSnapshot.key !== room.id) {
                        console.warn(`ID mismatch for room ${childSnapshot.key}: expected ${childSnapshot.key}, got ${room.id}`);
                    }

                    if (location && room.location) {
                        const distance = this.calculateDistance(
                            location.latitude,
                            location.longitude,
                            room.location.latitude,
                            room.location.longitude
                        );

                        if (distance <= radius) {
                            rooms.push(room);
                        }
                    } else {
                        rooms.push(room);
                    }
                });
            }

            callback(rooms.sort((a, b) =>
                new Date(b.lastMessageTime || b.createdAt).getTime() -
                new Date(a.lastMessageTime || a.createdAt).getTime()
            ));
        });

        return listener;
    }

    static subscribeToMessages(roomId: string, callback: (messages: ChatMessage[]) => void) {
        const messagesRef = ref(database, `chatMessages/${roomId}`);

        const listener = onValue(messagesRef, (snapshot) => {
            const messages: ChatMessage[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    messages.push(childSnapshot.val() as ChatMessage);
                });
            }
            callback(messages);
        });

        return listener;
    }

    static unsubscribe(listener: any) {
        if (listener) {
            off(listener);
        }
    }
}