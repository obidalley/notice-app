import ChatBubble from '@/components/ChatBubble';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/FirebaseService';
import { ChatMessage, ChatRoom } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, MoveVertical as MoreVertical, Send } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatScreenProps {
    room: ChatRoom;
    onBack: () => void;
}

export default function ChatScreen({ room, onBack }: ChatScreenProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            flatListRef?.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    const loadMessages = useCallback(async () => {
        if (!room?.id) {
            console.error('Room ID is missing');
            return;
        }

        try {
            const roomMessages = await FirebaseService.getMessages(room.id);
            const validMessages = roomMessages.filter((msg): msg is ChatMessage => !!msg && !!msg.id);
            setMessages(validMessages);
            scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
            Alert.alert('Error', 'Failed to load messages');
        }
    }, [room?.id, scrollToBottom]);

    useEffect(() => {
        if (!user || !room?.id) {
            console.error('User or room ID is missing');
            return;
        }

        loadMessages();

        // Subscribe to real-time updates
        const unsubscribe = FirebaseService.subscribeToMessages(room.id, (newMessages) => {
            const validMessages = newMessages.filter((msg): msg is ChatMessage => !!msg && !!msg.id);
            setMessages(validMessages);
            scrollToBottom();
        });

        return () => {
            if (unsubscribe) {
                FirebaseService.unsubscribe(unsubscribe);
            }
        };
    }, [user, room?.id, loadMessages, scrollToBottom]);

    const sendMessage = async () => {
        if (!inputText.trim() || !user || !room?.id || loading) {
            console.warn('Cannot send message: missing input, user, or room, or loading');
            return;
        }

        const messageData: Omit<ChatMessage, 'id' | 'timestamp'> = {
            roomId: room.id,
            senderId: user.id,
            senderName: user.displayName || 'Anonymous',
            senderPhoto: user.photoURL || undefined,
            text: inputText.trim(),
            type: 'text',
            read: false,
        };

        setInputText('');
        setLoading(true);

        try {
            await FirebaseService.sendMessage(messageData);
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const sendImage = async () => {
        if (!user || !room?.id || loading) {
            console.warn('Cannot send image: missing user or room, or loading');
            return;
        }

        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera roll permission is needed to select images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]?.uri) {
                setLoading(true);

                const imageUrl = await FirebaseService.uploadImage(result.assets[0].uri, 'chat-images');

                const messageData: Omit<ChatMessage, 'id' | 'timestamp'> = {
                    roomId: room.id,
                    senderId: user.id,
                    senderName: user.displayName || 'Anonymous',
                    senderPhoto: user.photoURL || undefined,
                    imageUrl,
                    type: 'image',
                    read: false,
                };

                await FirebaseService.sendMessage(messageData);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending image:', error);
            Alert.alert('Error', 'Failed to send image');
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        if (!item || !item.id) {
            return null;
        }

        const isCurrentUser = item.senderId === user?.id;
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const showAvatar = !isCurrentUser && (
            !previousMessage ||
            previousMessage.senderId !== item.senderId ||
            new Date(item.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 300000 // 5 minutes
        );

        return (
            <ChatBubble
                message={item}
                isCurrentUser={isCurrentUser}
                showAvatar={showAvatar}
            />
        );
    };

    if (!room || !room.id) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <ArrowLeft size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.message}>Error: Invalid chat room</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>

                <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name || 'Unnamed Room'}</Text>
                    <Text style={styles.memberCount}>
                        {(room.members?.length || 0)} member{room.members?.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                <TouchableOpacity style={styles.moreButton}>
                    <MoreVertical size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item?.id || Math.random().toString()}
                renderItem={renderMessage}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={scrollToBottom}
                ListEmptyComponent={
                    <View style={styles.emptyMessages}>
                        <Text style={styles.emptyMessagesText}>No messages yet. Start the conversation!</Text>
                    </View>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputContainer}
            >
                <View style={styles.inputRow}>
                    <TouchableOpacity style={styles.imageButton} onPress={sendImage} disabled={loading}>
                        <Camera size={20} color={loading ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        editable={!loading}
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, inputText.trim() && !loading ? styles.sendButtonActive : null]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || loading}
                    >
                        <Send size={20} color={inputText.trim() && !loading ? "#FFFFFF" : "#9CA3AF"} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    roomInfo: {
        flex: 1,
    },
    roomName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    memberCount: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    moreButton: {
        padding: 8,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        paddingVertical: 16,
        flexGrow: 1,
    },
    emptyMessages: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyMessagesText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    imageButton: {
        padding: 8,
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
        fontSize: 16,
        color: '#111827',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonActive: {
        backgroundColor: '#2563EB',
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        flex: 1,
    },
});