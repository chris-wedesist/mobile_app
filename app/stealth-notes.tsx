import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';
import { useStealthMode } from '../components/StealthModeManager';
import { useStealthAutoTimeout } from '../hooks/useStealthAutoTimeout';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';

type Note = {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  starred?: boolean;
};

const DEFAULT_NOTES: Note[] = [
  {
    id: '1',
    title: 'Shopping List',
    content:
      '- Milk\n- Bread\n- Eggs\n- Coffee\n- Bananas\n- Apples\n- Chicken\n- Rice',
    timestamp: Date.now() - 86400000, // 1 day ago
    starred: true,
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content:
      'Team sync:\n- Project updates\n- Timeline review\n- Action items\n\nFollow up with Sarah about design review\nSchedule next sprint planning',
    timestamp: Date.now() - 172800000, // 2 days ago
  },
  {
    id: '3',
    title: 'Ideas',
    content:
      '1. New app features\n2. Blog post topics\n3. Weeken plans\n4. Gift ideas for mom\n5. Books to read',
    timestamp: Date.now() - 259200000, // 3 days ago
  },
  {
    id: '4',
    title: 'Reminders',
    content:
      '- Call dentist\n- Renew subscription\n- Pay rent\n- Schedule car maintenance\n- Return library books',
    timestamp: Date.now() - 345600000, // 4 days ago
  },
];

export default function StealthNotesScreen() {
  const { deactivate } = useStealthMode();
  const [notes, setNotes] = useState<Note[]>(DEFAULT_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Use the auto timeout hook - exit stealth mode after 10 minutes of inactivity
  useStealthAutoTimeout(10);

  const handleLongPress = () => {
    deactivate('gesture');
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      timestamp: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, ...updates, timestamp: Date.now() } : note
    );
    setNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, ...updates, timestamp: Date.now() });
    }
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const toggleStar = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      updateNote(id, { starred: !note.starred });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort starred notes first, then by timestamp
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      return b.timestamp - a.timestamp;
    });

  return (
    <GestureHandlerRootView style={styles.container}>
      <LongPressGestureHandler
        minDurationMs={3000}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === 4) {
            // 4 = ACTIVE (long press triggered)
            handleLongPress();
          }
        }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notes</Text>
            <TouchableOpacity style={styles.headerButton}>
              <MaterialIcons name="more-vert" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={colors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.text.muted}
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.sidebar}>
              <Text style={styles.notesCount}>{notes.length} Notes</Text>

              <TouchableOpacity
                style={styles.newNoteButton}
                onPress={createNote}
              >
                <MaterialIcons name="add" size={20} color={colors.background} />
                <Text style={styles.newNoteText}>New Note</Text>
              </TouchableOpacity>

              <ScrollView style={styles.notesList}>
                {filteredNotes.map((note) => (
                  <TouchableOpacity
                    key={note.id}
                    style={[
                      styles.noteItem,
                      selectedNote?.id === note.id && styles.selectedNoteItem,
                    ]}
                    onPress={() => setSelectedNote(note)}
                  >
                    <View style={styles.noteItemHeader}>
                      <Text
                        style={[
                          styles.noteItemTitle,
                          selectedNote?.id === note.id &&
                            styles.selectedNoteItemTitle,
                        ]}
                        numberOfLines={1}
                      >
                        {note.title}
                      </Text>
                      {note.starred && (
                        <MaterialIcons name="star" size={16} color={colors.warning} />
                      )}
                    </View>
                    <Text style={styles.noteItemPreview} numberOfLines={2}>
                      {note.content}
                    </Text>
                    <Text style={styles.noteItemDate}>
                      {formatDate(note.timestamp)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.editor}>
              {selectedNote ? (
                <>
                  <View style={styles.editorHeader}>
                    <TextInput
                      style={styles.titleInput}
                      value={selectedNote.title}
                      onChangeText={(text) =>
                        updateNote(selectedNote.id, { title: text })
                      }
                      placeholder="Note title"
                      placeholderTextColor={colors.text.muted}
                    />
                    <View style={styles.editorActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => toggleStar(selectedNote.id)}
                      >
                        <MaterialIcons
                          size={20}
                          color={selectedNote.starred ? colors.warning : colors.text.muted}
                          fill={selectedNote.starred ? colors.warning : 'none'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteNote(selectedNote.id)}
                      >
                        <MaterialIcons name="delete" size={20} color={colors.text.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TextInput
                    style={styles.contentInput}
                    value={selectedNote.content}
                    onChangeText={(text) =>
                      updateNote(selectedNote.id, { content: text })
                    }
                    placeholder="Start writing..."
                    placeholderTextColor={colors.text.muted}
                    multiline
                    textAlignVertical="top"
                  />
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Select a note or create a new one
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LongPressGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    margin: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    paddingLeft: spacing.xs,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 300 : '40%',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },
  notesCount: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  newNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    margin: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.small,
    gap: spacing.xs,
  },
  newNoteText: {
    color: colors.background,
    fontSize: typography.fontSize.small,
    fontWeight: '600',
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedNoteItem: {
    backgroundColor: colors.border,
  },
  noteItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteItemTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  selectedNoteItemTitle: {
    color: colors.primary,
  },
  noteItemPreview: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  noteItemDate: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  editor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleInput: {
    flex: 1,
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
  },
  editorActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    padding: spacing.xs,
  },
  contentInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
