import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

type Note = {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  starred?: boolean;
};

export default function StealthCoverScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('cover_story_notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        // Add some default notes for authenticity
        const defaultNotes: Note[] = [
          {
            id: '1',
            title: 'Shopping List',
            content: '- Milk\n- Bread\n- Eggs\n- Coffee\n- Bananas',
            timestamp: Date.now() - 86400000 // 1 day ago
          },
          {
            id: '2',
            title: 'Meeting Notes',
            content: 'Team sync:\n- Project updates\n- Timeline review\n- Action items\n\nFollow up with Sarah about design review',
            timestamp: Date.now() - 172800000 // 2 days ago
          }
        ];
        await AsyncStorage.setItem('cover_story_notes', JSON.stringify(defaultNotes));
        setNotes(defaultNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      await AsyncStorage.setItem('cover_story_notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
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
    saveNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, ...updates, timestamp: Date.now() });
    }
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    saveNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.newNoteButton} onPress={createNote}>
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
              onPress={() => setSelectedNote(note)}>
              <View style={styles.noteItemContent}>
                <Text
                  style={[
                    styles.noteItemTitle,
                    selectedNote?.id === note.id && styles.selectedNoteItemTitle
                  ]}
                  numberOfLines={1}>
                  {note.title}
                </Text>
                <Text style={styles.noteItemDate}>
                  {formatDate(note.timestamp)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteNote(note.id)}>
                <MaterialIcons name="delete" size={16} color="#FF3B30" />
              </TouchableOpacity>
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
              />
              <TouchableOpacity style={styles.moreButton}>
                <MaterialIcons name="more-vert" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.contentInput}
              value={selectedNote.content}
              onChangeText={(text) => updateNote(selectedNote.id, { content: text })}
              placeholder="Start writing..."
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 250 : '40%',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectedNoteItem: {
    backgroundColor: '#E8F2FF',
  },
  noteItemContent: {
    flex: 1,
  },
  noteItemTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  selectedNoteItemTitle: {
    color: '#007AFF',
    fontWeight: '600',
  },
  noteItemDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  editor: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  titleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  moreButton: {
    padding: 5,
  },
  contentInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
});