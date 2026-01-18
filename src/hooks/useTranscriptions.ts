import { useState, useEffect, useCallback } from 'react';
import { db, DatabaseTranscription } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Transcription {
  id: string;
  filename: string;
  text: string;
  language: string;
  duration: number;
  createdAt: Date;
  status: 'completed' | 'processing' | 'failed';
}

export const useTranscriptions = () => {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadTranscriptions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await db.getUserTranscriptions(user.id);
      const formattedTranscriptions: Transcription[] = data.map((t: DatabaseTranscription) => ({
        id: t.id,
        filename: t.original_filename,
        text: t.transcript,
        language: t.language,
        duration: t.duration,
        createdAt: new Date(t.created_at),
        status: t.status,
      }));
      setTranscriptions(formattedTranscriptions);
    } catch (error) {
      console.error('Error loading transcriptions:', error);
      // Fallback to localStorage if Supabase fails
      const stored = localStorage.getItem('tanzify_transcriptions');
      if (stored) {
        const parsed = JSON.parse(stored).map((t: {
          id: string;
          filename: string;
          transcript: string;
          language: string;
          duration: number;
          createdAt: string;
          status: string;
        }) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }));
        setTranscriptions(parsed);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTranscriptions();
    } else {
      setTranscriptions([]);
      setLoading(false);
    }
  }, [user, loadTranscriptions]);

  const addTranscription = async (transcription: Omit<Transcription, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const dbTranscription = {
        user_id: user.id,
        filename: `${Date.now()}-${Math.random().toString(36).substring(2)}`, // S3 key
        original_filename: transcription.filename,
        s3_key: '', // Will be set after upload
        transcript: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        status: transcription.status,
      };

      const result = await db.createTranscription(dbTranscription);

      const newTranscription: Transcription = {
        ...transcription,
        id: result.id,
        createdAt: new Date(result.created_at),
      };

      setTranscriptions(prev => [newTranscription, ...prev]);
      return result;
    } catch (error) {
      console.error('Error adding transcription:', error);
      // Fallback to localStorage
      const newTranscription: Transcription = {
        ...transcription,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const updated = [newTranscription, ...transcriptions];
      setTranscriptions(updated);
      localStorage.setItem('tanzify_transcriptions', JSON.stringify(updated));
      return newTranscription;
    }
  };

  const updateTranscription = async (id: string, updates: Partial<Transcription>) => {
    try {
      // Update in Supabase
      const updateData: Partial<Pick<DatabaseTranscription, 'status' | 'transcript'>> = {};
      if (updates.status) updateData.status = updates.status;
      if (updates.text) updateData.transcript = updates.text;

      if (Object.keys(updateData).length > 0) {
        await db.updateTranscriptionStatus(id, updates.status || 'processing', updates.text);
      }

      // Update local state
      const updated = transcriptions.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      setTranscriptions(updated);
    } catch (error) {
      console.error('Error updating transcription:', error);
      // Fallback to localStorage
      const updated = transcriptions.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      setTranscriptions(updated);
      localStorage.setItem('tanzify_transcriptions', JSON.stringify(updated));
    }
  };

  return { transcriptions, loading, addTranscription, updateTranscription, loadTranscriptions };
};