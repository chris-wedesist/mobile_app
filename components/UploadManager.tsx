import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

class UploadManager {
  private static instance: UploadManager;
  
  private constructor() {}

  public static getInstance(): UploadManager {
    if (!UploadManager.instance) {
      UploadManager.instance = new UploadManager();
    }
    return UploadManager.instance;
  }

  async uploadPanicEvent(mediaUri: string, location: Location.LocationObject) {
    try {
      // Upload media to Supabase Storage
      const fileName = `panic-${Date.now()}.mp4`;
      const filePath = `public/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filePath, await FileSystem.readAsStringAsync(mediaUri, {
          encoding: FileSystem.EncodingType.Base64
        }));

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded media
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(filePath);

      // Create panic event record
      const { data: panicEvent, error: panicError } = await supabase
        .from('panic_events')
        .insert([{
          location: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
          media_urls: [publicUrl],
          status: 'active'
        }])
        .select()
        .single();

      if (panicError) throw panicError;

      // Create safe encounter record for community awareness
      const { data: encounter, error: encounterError } = await supabase
        .from('safe_encounters')
        .insert([{
          encounter_type: 'police_interaction',
          description: 'Panic event recorded',
          media_url: publicUrl,
          location: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
        }])
        .select()
        .single();

      if (encounterError) throw encounterError;

      return {
        panicEvent,
        encounter,
        mediaUrl: publicUrl
      };
    } catch (error) {
      console.error('Error uploading panic event:', error);
      throw error;
    }
  }

  async uploadSafeEncounter(
    mediaUri: string,
    location: Location.LocationObject,
    details: {
      type: string;
      description: string;
    }
  ) {
    try {
      // Upload media to Supabase Storage
      const fileName = `encounter-${Date.now()}.mp4`;
      const filePath = `public/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filePath, await FileSystem.readAsStringAsync(mediaUri, {
          encoding: FileSystem.EncodingType.Base64
        }));

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(filePath);

      // Create safe encounter record
      const { data: encounter, error: encounterError } = await supabase
        .from('safe_encounters')
        .insert([{
          encounter_type: details.type,
          description: details.description,
          media_url: publicUrl,
          location: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
        }])
        .select()
        .single();

      if (encounterError) throw encounterError;

      return {
        encounter,
        mediaUrl: publicUrl
      };
    } catch (error) {
      console.error('Error uploading safe encounter:', error);
      throw error;
    }
  }

  async uploadHeroStory(
    mediaUri: string | null,
    details: {
      title: string;
      story: string;
      category: string;
      tags: string[];
    }
  ) {
    try {
      let publicUrl = null;

      // Upload media if provided
      if (mediaUri) {
        const fileName = `story-${Date.now()}.mp4`;
        const filePath = `public/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('stories')
          .upload(filePath, await FileSystem.readAsStringAsync(mediaUri, {
            encoding: FileSystem.EncodingType.Base64
          }));

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage
          .from('stories')
          .getPublicUrl(filePath);
          
        publicUrl = url;
      }

      // Create hero story record
      const { data: story, error: storyError } = await supabase
        .from('hero_stories')
        .insert([{
          title: details.title,
          story: details.story,
          media_url: publicUrl,
          category: details.category,
          tags: details.tags,
          status: 'pending'
        }])
        .select()
        .single();

      if (storyError) throw storyError;

      return {
        story,
        mediaUrl: publicUrl
      };
    } catch (error) {
      console.error('Error uploading hero story:', error);
      throw error;
    }
  }

  async deleteMedia(mediaUrl: string) {
    try {
      const path = mediaUrl.split('/').pop();
      if (!path) throw new Error('Invalid media URL');

      const { error } = await supabase.storage
        .from('recordings')
        .remove([path]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }
}

export default UploadManager;