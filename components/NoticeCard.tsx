import { noticeService } from '@/services/NoticeService';
import { Notice, User } from '@/types';
import { AlertTriangle, Calendar, Heart, MapPin, MessageCircle, Share, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NoticeCardProps {
    notice: Notice;
    currentUser: User;
    onPress?: () => void;
    onRefresh?: () => void;
}

export default function NoticeCard({ notice, currentUser, onPress, onRefresh }: NoticeCardProps) {
    const [isLiked, setIsLiked] = useState(notice?.likes?.includes(currentUser.id));
    const [hasRSVP, setHasRSVP] = useState(notice?.rsvpList?.includes(currentUser.id));
    const [loading, setLoading] = useState(false);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'emergency': return '#DC2626';
            case 'high': return '#EA580C';
            case 'medium': return '#D97706';
            default: return '#059669';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return AlertTriangle;
            case 'event': return Calendar;
            default: return MessageCircle;
        }
    };

    const handleLike = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await noticeService.toggleLike(notice?.id, currentUser.id);
            setIsLiked(!isLiked);
            onRefresh?.();
        } catch (error) {
            Alert.alert('Error', 'Failed to update like');
        } finally {
            setLoading(false);
        }
    };

    const handleRSVP = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await noticeService.toggleRSVP(notice?.id, currentUser.id);
            setHasRSVP(!hasRSVP);
            onRefresh?.();
        } catch (error) {
            Alert.alert('Error', 'Failed to update RSVP');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        Alert.alert('Share', `Share "${notice?.title}" with others?`);
    };

    const TypeIcon = getTypeIcon(notice?.type);
    const priorityColor = getPriorityColor(notice?.priority);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

            <View style={styles.header}>
                <View style={styles.authorInfo}>
                    {notice?.authorPhoto ? (
                        <Image source={{ uri: notice?.authorPhoto }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>{notice?.authorName.charAt(0)}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.authorName}>{notice?.authorName}</Text>
                        <Text style={styles.timestamp}>
                            {new Date(notice?.createdAt).toLocaleDateString()} • {new Date(notice?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>

                <View style={styles.typeContainer}>
                    <TypeIcon size={16} color={priorityColor} />
                    <Text style={[styles.typeText, { color: priorityColor }]}>
                        {notice?.type.toUpperCase()}
                    </Text>
                </View>
            </View>

            <Text style={styles.title}>{notice?.title}</Text>
            <Text style={styles.description} numberOfLines={3}>{notice?.description}</Text>

            {notice?.imageUrl && (
                <Image source={{ uri: notice?.imageUrl }} style={styles.noticeImage} />
            )}

            <View style={styles.locationContainer}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.locationText}>{notice?.location?.address}</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, isLiked && styles.actionButtonActive]}
                    onPress={handleLike}
                    disabled={loading}
                >
                    <Heart size={18} color={isLiked ? '#DC2626' : '#6B7280'} fill={isLiked ? '#DC2626' : 'none'} />
                    <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                        {notice?.likes?.length}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={onPress}>
                    <MessageCircle size={18} color="#6B7280" />
                    <Text style={styles.actionText}>{notice?.comments?.length}</Text>
                </TouchableOpacity>

                {notice?.type === 'event' && (
                    <TouchableOpacity
                        style={[styles.actionButton, hasRSVP && styles.actionButtonActive]}
                        onPress={handleRSVP}
                        disabled={loading}
                    >
                        <Users size={18} color={hasRSVP ? '#059669' : '#6B7280'} />
                        <Text style={[styles.actionText, hasRSVP && styles.actionTextActive]}>
                            {notice?.rsvpList?.length}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <Share size={18} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    priorityBar: {
        height: 4,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
        paddingBottom: 8,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarPlaceholder: {
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    timestamp: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    noticeImage: {
        width: '100%',
        height: 200,
        marginBottom: 12,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    locationText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    actionButtonActive: {
        backgroundColor: '#F3F4F6',
    },
    actionText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
        fontWeight: '500',
    },
    actionTextActive: {
        color: '#111827',
    },
});