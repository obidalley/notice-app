import NoticeCard from '@/components/NoticeCard';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { noticeService } from '@/services/NoticeService';
import { Notice } from '@/types';
import { Bell, Filter, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user, checkAuthState } = useAuth();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'event' | 'alert' | 'news'>('all');

  useEffect(() => {
    checkAuthState();
    loadNotices();
  }, [location, filterType]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      let data: Notice[];
      if (location && !locationLoading && !locationError) {
        // Fetch notices within 10km of user's location
        data = await noticeService.getNotices({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } else {
        data = await noticeService.getNotices();
      }

      // Filter notices by type
      const filteredData = filterType === 'all'
        ? data
        : data.filter(notice => notice.type === filterType);

      const validNotices = filteredData.filter((notice) => {
        if (!notice.id || typeof notice.id !== 'string') {
          //console.warn('Notice missing or invalid ID:', notice);
          return false;
        }
        if (!notice.type) {
          //console.warn('Notice missing type:', notice);
          return false;
        }
        return true;
      });

      //console.log('Loaded and filtered notices:', validNotices);
      setNotices(validNotices);
    } catch (error) {
      //console.error('Error loading notices:', error);
      Alert.alert('Error', 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotices();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [filterType]);

  const handleNoticePress = (notice: Notice) => {
    Alert.alert(notice.title || 'Untitled', notice.description || 'No description');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Please sign in to view notices</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Community Notices</Text>
          <View style={styles.locationContainer}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.locationText}>
              {location
                ? `Notices within 10km of ${location.address}`
                : locationLoading
                  ? 'Getting location...'
                  : locationError
                    ? 'Location unavailable - showing all notices'
                    : 'Enable location to see nearby notices'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Bell size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              const types = ['all', 'event', 'alert', 'news'] as const;
              const currentIndex = types.indexOf(filterType);
              const nextIndex = (currentIndex + 1) % types.length;
              setFilterType(types[nextIndex]);
            }}
          >
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {filterType !== 'all' && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterText}>Filtering by: {filterType.toUpperCase()}</Text>
        </View>
      )}

      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoticeCard
            notice={item}
            currentUser={user}
            onPress={() => handleNoticePress(item)}
            onRefresh={loadNotices}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.message}>
            {loading
              ? 'Loading notices...'
              : locationError
                ? 'No notices available due to location error'
                : `No ${filterType === 'all' ? '' : filterType} notices found near your location`}
          </Text>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginLeft: 8,
  },
  filterIndicator: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
});