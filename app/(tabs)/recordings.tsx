import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Share,
  Platform,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { createClient } from '@supabase/supabase-js';
import { colors, shadows, radius } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

type Recording = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  share_count: number;
  view_count: number;
  download_count: number;
  youtube_url: string | null;
  created_at: string;
  user_id: string;
  status: 'processing' | 'public' | 'private' | 'deleted';
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
};

export default function RecordingsScreen() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const videoRef = useRef<Video>(null);

  const fetchRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('incident_recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (recordingId: string) => {
    try {
      const { data, error } = await supabase
        .from('incident_comments')
        .select('*')
        .eq('recording_id', recordingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [recordingId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleShare = async (recording: Recording) => {
    try {
      if (Platform.OS === 'web') {
        await navigator.share({
          title: recording.title,
          text: recording.description,
          url: recording.video_url,
        });
      } else {
        await Share.share({
          title: recording.title,
          message: `${recording.description}\n\n${recording.video_url}`,
        });
      }

      // Update share count
      await supabase
        .from('incident_recordings')
        .update({ share_count: recording.share_count + 1 })
        .eq('id', recording.id);

      // Update local state
      setRecordings(prev =>
        prev.map(r =>
          r.id === recording.id ? { ...r, share_count: r.share_count + 1 } : r
        )
      );
    } catch (error) {
      console.error('Error sharing recording:', error);
    }
  };

  const handleDownload = async (recording: Recording) => {
    try {
      if (Platform.OS === 'web') {
        // For web, create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = recording.video_url;
        link.download = `${recording.title}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For mobile, download to device using expo-file-system
        const callback = (downloadProgress: any) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          // Update UI with progress if needed
        };

        const downloadResumable = FileSystem.createDownloadResumable(
          recording.video_url,
          FileSystem.documentDirectory + `${recording.title}.mp4`,
          {},
          callback
        );

        const { uri } = await downloadResumable.downloadAsync();
        if (uri) {
          // Share the downloaded file
          await Sharing.shareAsync(uri);
        }
      }

      // Update download count
      await supabase
        .from('incident_recordings')
        .update({ download_count: recording.download_count + 1 })
        .eq('id', recording.id);

      // Update local state
      setRecordings(prev =>
        prev.map(r =>
          r.id === recording.id ? { ...r, download_count: r.download_count + 1 } : r
        )
      );
    } catch (error) {
      console.error('Error downloading recording:', error);
    }
  };

  const handleComment = async (recordingId: string) => {
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const { data, error } = await supabase
        .from('incident_comments')
        .insert([
          {
            recording_id: recordingId,
            content: newComment.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setComments(prev => ({
        ...prev,
        [recordingId]: [...(prev[recordingId] || []), data],
      }));
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecordings();
    setRefreshing(false);
  }, []);

  const renderRecording = ({ item }: { item: Recording }) => {
    const isSelected = selectedRecording === item.id;
    const recordingComments = comments[item.id] || [];

    return (
      <View style={styles.recordingCard as ViewStyle}>
        <TouchableOpacity
          style={styles.thumbnailContainer as ViewStyle}
          onPress={() => {
            setSelectedRecording(isSelected ? null : item.id);
            if (!isSelected) {
              fetchComments(item.id);
            }
          }}>
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.thumbnail as ImageStyle}
          />
          <View style={styles.playButton as ViewStyle}>
            <MaterialIcons name="play-arrow" size={24} color={colors.text.primary} />
          </View>
        </TouchableOpacity>

        <View style={styles.recordingInfo as ViewStyle}>
          <Text style={styles.title as TextStyle}>{item.title}</Text>
          <Text style={styles.description as TextStyle}>{item.description}</Text>

          <View style={styles.stats as ViewStyle}>
            <View style={styles.stat as ViewStyle}>
              <MaterialIcons name="visibility" size={16} color={colors.text.muted} />
              <Text style={styles.statText as TextStyle}>{item.view_count}</Text>
            </View>
            <View style={styles.stat as ViewStyle}>
              <MaterialIcons name="share" size={16} color={colors.text.muted} />
              <Text style={styles.statText as TextStyle}>{item.share_count}</Text>
            </View>
            <View style={styles.stat as ViewStyle}>
              <MaterialIcons name="file-download" size={16} color={colors.text.muted} />
              <Text style={styles.statText as TextStyle}>{item.download_count}</Text>
            </View>
          </View>

          <View style={styles.actions as ViewStyle}>
            <TouchableOpacity
              style={styles.actionButton as ViewStyle}
              onPress={() => handleShare(item)}>
              <MaterialIcons name="share" size={20} color={colors.text.primary} />
              <Text style={styles.actionText as TextStyle}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton as ViewStyle}
              onPress={() => handleDownload(item)}>
              <MaterialIcons name="file-download" size={20} color={colors.text.primary} />
              <Text style={styles.actionText as TextStyle}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton as ViewStyle, { opacity: item.youtube_url ? 0.5 : 1 }]}
              disabled={!!item.youtube_url}>
              <MaterialIcons name="upload" size={20} color={colors.text.primary} />
              <Text style={styles.actionText as TextStyle}>
                {item.youtube_url ? 'Uploaded' : 'Upload to YT'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.commentsHeader as ViewStyle}
            onPress={() => {
              setSelectedRecording(isSelected ? null : item.id);
              if (!isSelected) {
                fetchComments(item.id);
              }
            }}>
            <View style={styles.commentsHeaderLeft as ViewStyle}>
              <MaterialIcons name="message" size={20} color={colors.text.muted} />
              <Text style={styles.commentsCount as TextStyle}>
                {recordingComments.length} Comments
              </Text>
            </View>
            {isSelected ? (
              <MaterialIcons name="expand-less" size={20} color={colors.text.muted} />
            ) : (
              <MaterialIcons name="expand-more" size={20} color={colors.text.muted} />
            )}
          </TouchableOpacity>

          {isSelected && (
            <View style={styles.commentsSection as ViewStyle}>
              <View style={styles.commentsList as ViewStyle}>
                {recordingComments.map(comment => (
                  <View key={comment.id} style={styles.comment as ViewStyle}>
                    <Text style={styles.commentContent as TextStyle}>{comment.content}</Text>
                    <Text style={styles.commentTime as TextStyle}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.commentInput as ViewStyle}>
                <TextInput
                  style={styles.input as TextStyle}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.text.muted}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton as ViewStyle,
                    { opacity: commentLoading || !newComment.trim() ? 0.5 : 1 },
                  ]}
                  onPress={() => handleComment(item.id)}
                  disabled={commentLoading || !newComment.trim()}>
                  {commentLoading ? (
                    <ActivityIndicator color={colors.text.primary} size="small" />
                  ) : (
                    <MaterialIcons name="send" size={20} color={colors.text.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer as ViewStyle}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container as ViewStyle}>
      <Text style={styles.screenTitle as TextStyle}>Incident Recordings</Text>
      <FlatList
        data={recordings}
        renderItem={renderRecording}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list as ViewStyle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  list: {
    padding: 20,
  },
  recordingCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 20,
    ...shadows.sm,
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.text.muted,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.accent}cc`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 15,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: colors.text.muted,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: radius.lg,
    marginHorizontal: 5,
  },
  actionText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  commentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsCount: {
    color: colors.text.muted,
    fontSize: 14,
  },
  commentsSection: {
    marginTop: 15,
  },
  commentsList: {
    gap: 15,
  },
  comment: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: radius.lg,
  },
  commentContent: {
    color: colors.text.primary,
    fontSize: 14,
    marginBottom: 5,
  },
  commentTime: {
    color: colors.text.muted,
    fontSize: 12,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 15,
  },
  input: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 12,
    color: colors.text.primary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.accent,
    width: 40,
    height: 40,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
});