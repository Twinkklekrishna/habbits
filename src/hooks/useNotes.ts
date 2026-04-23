import { useEffect, useState } from 'react';
import type { NoteItem } from '../types.ts';

const STORAGE_KEY = 'comeback_era_notes_v1';

export function useNotes() {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const saveNote = (id: string | null, title: string, text: string) => {
    const updatedAt = Date.now();
    if (!id) {
      const newNote: NoteItem = {
        id: crypto.randomUUID(),
        title: title.trim() || 'Untitled note',
        text,
        createdAt: updatedAt,
        updatedAt,
      };

      setNotes((prev) => [newNote, ...prev]);
      return newNote.id;
    }

    setNotes((prev) => prev.map((note) => (
      note.id === id
        ? { ...note, title: title.trim() || 'Untitled note', text, updatedAt }
        : note
    )));

    return id;
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const getNoteById = (id: string) => notes.find((note) => note.id === id) ?? null;

  return { notes, saveNote, deleteNote, getNoteById };
}