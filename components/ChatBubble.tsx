import { ChatMessage } from '@/types';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ChatBubbleProps {
    message: ChatMessage;
    isCurrentUser: boolean;
    showAvatar?: boolean;
}

export default function ChatBubble({ message, isCurrentUser, showAvatar = false }: ChatBubbleProps) {
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.container, isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer]}>
            {!isCurrentUser && showAvatar && (
                <View style={styles.avatarContainer}>
                    {message?.senderPhoto ? (
                        <Image source={{ uri: message?.senderPhoto }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>{message?.senderName?.charAt(0)}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={[styles.bubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
                {!isCurrentUser && showAvatar && (
                    <Text style={styles.senderName}>{message?.senderName}</Text>
                )}

                {message?.type === 'image' && message?.imageUrl ? (
                    <Image source={{ uri: message?.imageUrl }} style={styles.messageImage} />
                ) : (
                    <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
                        {message?.text}
                    </Text>
                )}

                <Text style={[styles.timestamp, isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp]}>
                    {formatTime(message?.timestamp)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 2,
        paddingHorizontal: 16,
    },
    currentUserContainer: {
        justifyContent: 'flex-end',
    },
    otherUserContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        alignSelf: 'flex-end',
        marginBottom: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '600',
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        marginBottom: 4,
    },
    currentUserBubble: {
        backgroundColor: '#2563EB',
        borderBottomRightRadius: 6,
    },
    otherUserBubble: {
        backgroundColor: '#F3F4F6',
        borderBottomLeftRadius: 6,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    currentUserText: {
        color: '#FFFFFF',
    },
    otherUserText: {
        color: '#111827',
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
    },
    currentUserTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'right',
    },
    otherUserTimestamp: {
        color: '#9CA3AF',
    },
});