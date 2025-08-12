import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { GestureHandlerRootView, LongPressGestureHandler } from 'react-native-gesture-handler';
import { useStealthMode } from '../components/StealthModeManager';
import { useStealthAutoTimeout } from '../hooks/useStealthAutoTimeout';
import { colors, shadows, radius } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

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
    content: '- Milk\n- Bread\n- Eggs\n- Coffee\n- Bananas\n- Apples\n- Chicken\n- Rice',
    timestamp: Date.now() - 86400000, // 1 day ago
    starred: true
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: 'Team sync:\n- Project updates\n- Timeline review\n- Action items\n\nFollow up with Sarah about design review\nSchedule next sprint planning',
    timestamp: Date.now() - 172800000 // 2 days ago
  },
  {
    id: '3',
    title: 'Ideas',
    content: '1. New app features\n2. Blog post topics\n3. Weeken plans\n4. Gift ideas for mom\n5. Books to read',
    timestamp: Date.now() - 259200000 // 3 days ago
  },
  {
    id: '4',
    title: 'Reminders',
    content: '- Call dentist\n- Renew subscription\n- Pay rent\n- Schedule car maintenance\n- Return library books',
    timestamp: Date.now() - 345600000 // 4 days ago
  }
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
      timestamp: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, ...updates, timestamp: Date.now() }
        : note
    );
    setNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, ...updates, timestamp: Date.now() });
    }
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const toggleStar = (id: string) => {
    const note = notes.find(n => n.id === id);
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

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
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
          if (nativeEvent.state === 4) { // 4 = ACTIVE (long press triggered)
            handleLongPress();
          }
        }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notes</Text>
            <TouchableOpacity style={styles.headerButton}>
              <MaterialIcons name="more-vert" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.sidebar}>
              <Text style={styles.notesCount}>{notes.length} Notes</Text>
              
              <TouchableOpacity 
                style={styles.newNoteButton} 
                onPress={createNote}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.newNoteText}>New Note</Text>
              </TouchableOpacity>
              
              <ScrollView style={styles.notesList}>
                {filteredNotes.map(note => (
                  <TouchableOpacity
                    key={note.id}
                    style={[
                      styles.noteItem,
                      selectedNote?.id === note.id && styles.selectedNoteItem
                    ]}
                    onPress={() => setSelectedNote(note)}
                  >
                    <View style={styles.noteItemHeader}>
                      <Text 
                        style={[
                          styles.noteItemTitle,
                          selectedNote?.id === note.id && styles.selectedNoteItemTitle
                        ]}
                        numberOfLines={1}
                      >
                        {note.title}
                      </Text>
                      {note.starred && (
                        <MaterialIcons name="star" size={16} color="#FFB800" />
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
                      onChangeText={(text) => updateNote(selectedNote.id, { title: text })}
                      placeholder="Note title"
                      placeholderTextColor="#999"
                    />
                    <View style={styles.editorActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => toggleStar(selectedNote.id)}
                      >
                        <MaterialIcons
                          size={20}
                          color={selectedNote.starred ? "#FFB800" : "#999"}
                          fill={selectedNote.starred ? "#FFB800" : "none"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteNote(selectedNote.id)}
                      >
                        <MaterialIcons name="delete" size={20} color="#999" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TextInput
                    style={styles.contentInput}
                    value={selectedNote.content}
                    onChangeText={(text) => updateNote(selectedNote.id, { content: text })}
                    placeholder="Start writing..."
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                  />
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Select a note or create a new one</Text>
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 10,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000',
    paddingLeft: 8,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 300 : '40%',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    backgroundColor: '#F2F2F7',
  },
  notesCount: {
    fontSize: 14,
    color: '#8E8E93',
    padding: 10,
    paddingLeft: 15,
  },
  newNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    margin: 10,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  newNoteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  selectedNoteItem: {
    backgroundColor: '#E5E5EA',
  },
  noteItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  selectedNoteItemTitle: {
    color: '#007AFF',
  },
  noteItemPreview: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
    lineHeight: 18,
  },
  noteItemDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  editor: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  editorActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    padding: 5,
  },
  contentInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});