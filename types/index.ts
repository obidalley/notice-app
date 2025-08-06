export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string | null;
    location?: {
        latitude: number;
        longitude: number;
        address: string;
    } | null;
    createdAt: string;
}

export interface Notice {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    type: 'event' | 'alert' | 'news';
    title: string;
    description: string;
    imageUrl?: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    } | null;
    createdAt: string;
    expiresAt?: string;
    rsvpList: string[];
    comments: Comment[];
    likes: string[];
    priority: 'low' | 'medium' | 'high' | 'emergency';
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    text: string;
    createdAt: string;
}

export interface ChatRoom {
    id: string;
    name: string;
    type: 'private' | 'group';
    members: string[];
    lastMessage?: ChatMessage;
    lastMessageTime?: string;
    createdAt: string;
    createdBy: string;
    location?: {
        latitude: number;
        longitude: number;
        address: string;
    } | null;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    text?: string;
    imageUrl?: string;
    type: 'text' | 'image' | 'system';
    timestamp: string;
    read: boolean;
}

export interface NotificationData {
    type: 'notice' | 'chat' | 'emergency';
    title: string;
    body: string;
    data?: any;
}