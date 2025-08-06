import { database } from '@/config/firebase';
import { Comment, Notice } from '@/types';
import { get, push, ref, set } from 'firebase/database';

class NoticeService {
    private noticesRef = ref(database, 'notices');

    async getNotices(location?: { latitude: number; longitude: number }, radius = 10): Promise<Notice[]> {
        try {
            const snapshot = await get(this.noticesRef);
            if (snapshot.exists()) {
                const notices: Notice[] = [];
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
                    return undefined; // Continue iteration
                });
                return notices.reverse();
            }
            return [];
        } catch (error) {
            console.error('Error getting notices:', error);
            return [];
        }
    }

    async createNotice(notice: Omit<Notice, 'id' | 'createdAt' | 'rsvpList' | 'comments' | 'likes'>): Promise<Notice> {
        try {
            const noticeRef = push(this.noticesRef); // Generate a unique key for the new notice
            const newNotice: Notice = {
                ...notice,
                id: noticeRef.key!,
                createdAt: new Date().toISOString(),
                rsvpList: [],
                comments: [],
                likes: [],
            };

            await set(noticeRef, newNotice);
            return newNotice;
        } catch (error) {
            console.error('Error creating notice:', error);
            throw error;
        }
    }

    async addComment(noticeId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<void> {
        try {
            const noticeRef = ref(database, `notices/${noticeId}`);
            const snapshot = await get(noticeRef);

            if (snapshot.exists()) {
                const commentRef = push(ref(database, `notices/${noticeId}/comments`));
                const newComment: Comment = {
                    ...comment,
                    id: commentRef.key!,
                    createdAt: new Date().toISOString(),
                };

                await set(commentRef, newComment);
            } else {
                throw new Error('Notice not found');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    async toggleRSVP(noticeId: string, userId: string): Promise<void> {
        try {
            const rsvpRef = ref(database, `notices/${noticeId}/rsvpList`);
            const snapshot = await get(rsvpRef);
            const rsvpList: string[] = snapshot.val() || [];

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

    async toggleLike(noticeId: string, userId: string): Promise<void> {
        try {
            const likesRef = ref(database, `notices/${noticeId}/likes`);
            const snapshot = await get(likesRef);
            const likes: string[] = snapshot.val() || [];

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

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    }
}

export const noticeService = new NoticeService();