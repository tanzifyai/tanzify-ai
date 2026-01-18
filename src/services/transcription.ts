import { s3Service } from './s3';
import { emailService } from './email';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

export async function transcribeAudio(file: File, language?: string, userId?: string): Promise<TranscriptionResult> {
  try {
    // Upload file to S3 first
    let s3Key = '';
    if (userId) {
      const uploadResult = await s3Service.uploadFile(file, userId);
      s3Key = uploadResult.key;
    }

    // Get signed URL for OpenAI API
    const signedUrl = s3Key ? await s3Service.getSignedUrl(s3Key) : '';

    // For now, we'll use the direct file approach since OpenAI API expects direct file upload
    // In production, you might want to use a backend service to handle this securely

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    if (language && language !== 'auto') {
      formData.append('language', language);
    }
    formData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Update user minutes used if userId provided
    if (userId && data.duration) {
      try {
        const userData = await db.getUser(userId);
        const minutesToAdd = Math.ceil(data.duration / 60); // Convert seconds to minutes
        const newMinutesUsed = (userData.minutes_used || 0) + minutesToAdd;
        await db.updateUserMinutes(userData.id, newMinutesUsed);
      } catch (updateError) {
        console.error('Error updating user minutes:', updateError);
        // Don't fail the transcription if update fails
      }
    }

    // Send completion email if user ID is provided
    if (userId && data.text) {
      try {
        // Note: In a real implementation, you'd get the user's email from the database
        // For now, we'll skip the email as we don't have the email here
        // emailService.sendTranscriptionCompleteEmail(userEmail, file.name, data.text.length);
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
      }
    }

    return {
      text: data.text,
      language: data.language,
      duration: data.duration,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}