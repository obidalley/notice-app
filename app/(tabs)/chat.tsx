import ChatScreen from '@/components/ChatScreen';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useLocation } from '@/hooks/useLocation';
import { FirebaseService } from '@/services/FirebaseService';
import { ChatRoom } from '@/types';
import { MessageSquare, Plus, Search, Users, X } from 'lucide-react-native';
import React, { Component, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatRoomItemProps {
    room: ChatRoom;
    onPress: () => void;
    onJoin: () => void;
    isMember: boolean;
}

function ChatRoomItem({ room, onPress, onJoin, isMember }: ChatRoomItemProps) {
    const formatTime = (timestamp?: string) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';
            const now = new Date();
            const diff = now.getTime() - date.getTime();

            if (diff < 24 * 60 * 60 * 1000) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return '';
        }
    };

    if (!room || !room.id || !room.name || !Array.isArray(room.members)) {
        console.warn('Invalid room data:', room);
        return null;
    }

    return (
        <View style={styles.roomItem}>
            <TouchableOpacity style={styles.roomContentContainer} onPress={onPress}>
                <View style={styles.roomAvatar}>
                    {room.type === 'group' ? (
                        <Users size={24} color="#6B7280" />
                    ) : (
                        <MessageSquare size={24} color="#6B7280" />
                    )}
                </View>

                <View style={styles.roomContent}>
                    <View style={styles.roomHeader}>
                        <Text style={styles.roomName}>{room.name || 'Unnamed Room'}</Text>
                        <Text style={styles.roomTime}>
                            {formatTime(room.lastMessageTime)}
                        </Text>
                    </View>

                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {room.lastMessage?.text || room.lastMessage?.imageUrl ? '📷 Image' : 'No messages yet'}
                    </Text>

                    <View style={styles.roomMeta}>
                        <Text style={styles.memberCount}>
                            {room.members.length} member{room.members.length !== 1 ? 's' : ''}
                        </Text>
                        {room.location && (
                            <Text style={styles.locationText}>
                                {room.location.address || 'Unknown location'}
                            </Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>

            {!isMember && (
                <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
                    <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <Text style={styles.message}>
                        Something went wrong: {this.state.error || 'Unknown error'}
                    </Text>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        <Text style={styles.createButtonText}>Retry</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            );
        }
        return this.props.children;
    }
}

export default function ChatTabScreen() {
    const { user } = useFirebaseAuth();
    const { location, loading: locationLoading, error: locationError } = useLocation();
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [subscription, setSubscription] = useState<any>(null);
    const [locationTimeout, setLocationTimeout] = useState(false);

    useEffect(() => {
        console.log('ChatTabScreen useEffect:', { user, location, locationLoading, locationError });

        const timeout = setTimeout(() => {
            if (locationLoading) {
                console.warn('Location loading timed out');
                setLocationTimeout(true);
            }
        }, 5000); // Reduced to 5 seconds for faster fallback

        if (!user) {
            setLoading(false);
            clearTimeout(timeout);
            return;
        }

        loadChatRooms();

        const effectiveLocation = locationTimeout || locationError || !location || isNaN(location.latitude) || isNaN(location.longitude)
            ? undefined // Fallback to fetching all rooms
            : { latitude: location.latitude, longitude: location.longitude };

        const sub = FirebaseService.subscribeToChatRooms(
            (rooms) => {
                const validRooms = rooms.filter((room): room is ChatRoom => {
                    const isValid = !!room && !!room.id && !!room.name && Array.isArray(room.members);
                    if (!isValid) {
                        console.warn('Invalid room in subscription:', room);
                    }
                    return isValid;
                });
                console.log('Subscribed chat rooms:', validRooms);
                setChatRooms(validRooms);
            },
            effectiveLocation
        );
        setSubscription(sub);

        return () => {
            clearTimeout(timeout);
            if (sub) {
                FirebaseService.unsubscribe(sub);
            }
        };
    }, [user, location, locationTimeout]); // Simplified dependency array

    const loadChatRooms = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const effectiveLocation = locationTimeout || locationError || !location || isNaN(location.latitude) || isNaN(location.longitude)
                ? undefined // Fallback to fetching all rooms
                : { latitude: location.latitude, longitude: location.longitude };

            const rooms = await FirebaseService.getChatRooms(effectiveLocation);
            const validRooms = rooms.filter((room): room is ChatRoom => {
                const isValid = !!room && !!room.id && !!room.name && Array.isArray(room.members);
                if (!isValid) {
                    console.warn('Invalid room in loadChatRooms:', room);
                }
                return isValid;
            });
            console.log('Loaded chat rooms:', validRooms);
            setChatRooms(validRooms);
        } catch (error) {
            console.error('Error loading chat rooms:', error);
            Alert.alert('Error', 'Failed to load chat rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomName.trim() || !user) {
            Alert.alert('Error', 'Please enter a room name');
            return;
        }
        const effectiveLocation = locationTimeout || locationError || !location || isNaN(location.latitude) || isNaN(location.longitude)
            ? user.location && !isNaN(user.location.latitude) && !isNaN(user.location.longitude)
                ? user.location
                : null
            : location;

        if (!effectiveLocation) {
            Alert.alert('Error', 'Location is required to create a chat room. Please enable location services or update your profile location.');
            return;
        }

        try {
            const roomData = {
                name: newRoomName.trim(),
                type: 'group' as const,
                createdBy: user.id,
                location: {
                    latitude: effectiveLocation.latitude,
                    longitude: effectiveLocation.longitude,
                    address: effectiveLocation.address || 'Unknown address',
                },
            };

            await FirebaseService.createChatRoom(roomData);
            setNewRoomName('');
            setShowCreateModal(false);
            loadChatRooms();
            Alert.alert('Success', 'Chat room created successfully!');
        } catch (error) {
            console.error('Error creating chat room:', error);
            Alert.alert('Error', 'Failed to create chat room');
        }
    };

    const handleJoinRoom = async (roomId: string) => {
        if (!user) {
            Alert.alert('Error', 'Please sign in to join a chat room');
            return;
        }

        try {
            await FirebaseService.joinChatRoom(roomId, user.id);
            Alert.alert('Success', 'Joined chat room successfully!');
            loadChatRooms();
        } catch (error) {
            console.error('Error joining chat room:', error);
            Alert.alert('Error', 'Failed to join chat room');
        }
    };

    const handleSelectRoom = (room: ChatRoom) => {
        console.log('Navigating to ChatScreen for room:', room.id);
        setSelectedRoom(room);
    };

    const filteredRooms = chatRooms.filter(room =>
        room?.name?.toLowerCase?.()?.includes(searchQuery.toLowerCase()) ?? false
    );

    if (selectedRoom) {
        return (
            <ErrorBoundary>
                {selectedRoom && selectedRoom.id ? (
                    <ChatScreen
                        room={selectedRoom}
                        onBack={() => {
                            console.log('Navigating back from ChatScreen');
                            setSelectedRoom(null);
                        }}
                    />
                ) : (
                    <SafeAreaView style={styles.container}>
                        <Text style={styles.message}>Error: No chat room selected</Text>
                    </SafeAreaView>
                )}
            </ErrorBoundary>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.message}>Please sign in to access chat</Text>
            </SafeAreaView>
        );
    }

    return (
        <ErrorBoundary>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Community Chat</Text>
                        <Text style={styles.locationText}>
                            {locationTimeout || locationError || !location
                                ? 'Showing all chat rooms'
                                : `Chat rooms within 10km of ${location.address || 'Unknown address'}`}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
                        <Plus size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search chat rooms..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <FlatList
                    data={filteredRooms}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChatRoomItem
                            room={item}
                            onPress={() => handleSelectRoom(item)}
                            onJoin={() => handleJoinRoom(item.id)}
                            isMember={item.members.includes(user.id)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={loadChatRooms}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MessageSquare size={48} color="#9CA3AF" />
                            <Text style={styles.emptyTitle}>No Chat Rooms</Text>
                            <Text style={styles.emptyDescription}>
                                {locationTimeout || locationError
                                    ? 'No chat rooms available'
                                    : 'No chat rooms found. Create one to connect with your community!'}
                            </Text>
                            <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
                                <Text style={styles.createButtonText}>Create Room</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />

                <Modal
                    visible={showCreateModal}
                    transparent
                    animationType="slide"
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Create Chat Room</Text>
                                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                    <X size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Room name..."
                                placeholderTextColor="#9CA3AF"
                                value={newRoomName}
                                onChangeText={setNewRoomName}
                                autoFocus
                            />

                            <Text style={styles.locationText}>
                                {locationTimeout || locationError || !location
                                    ? 'Using profile location'
                                    : `Location: ${location.address || 'Unknown address'}`}
                            </Text>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={() => setShowCreateModal(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalCreateButton, (!newRoomName.trim() || (!location && !user.location)) && styles.modalCreateButtonDisabled]}
                                    onPress={handleCreateRoom}
                                    disabled={!newRoomName.trim() || (!location && !user.location)}
                                >
                                    <Text style={styles.modalCreateText}>Create</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
        flexShrink: 1,
    },
    addButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        paddingVertical: 12,
    },
    listContent: {
        paddingBottom: 20,
    },
    roomItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    roomContentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    roomAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    roomContent: {
        flex: 1,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    roomName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    roomTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    lastMessage: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    roomMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    memberCount: {
        fontSize: 12,
        color: '#9CA3AF',
        marginRight: 8,
    },
    joinButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalCancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
    },
    modalCancelText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    modalCreateButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    modalCreateButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    modalCreateText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 40,
    },
});