import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

class AutoWipeManager {
  private static instance: AutoWipeManager;
  
  private constructor() {}

  public static getInstance(): AutoWipeManager {
    if (!AutoWipeManager.instance) {
      AutoWipeManager.instance = new AutoWipeManager();
    }
    return AutoWipeManager.instance;
  }

  async wipeLocalMedia(mediaUri: string): Promise<boolean> {
    try {
      if (!mediaUri) return false;

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(mediaUri);
      if (!fileInfo.exists) return false;

      // Overwrite file with random data before deletion for secure wipe
      const fileSize = fileInfo.size || 1024; // Default to 1KB if size unknown
      const randomData = new Uint8Array(fileSize);
      crypto.getRandomValues(randomData);
      
      // Write random data to file
      await FileSystem.writeAsStringAsync(
        mediaUri,
        String.fromCharCode.apply(null, Array.from(randomData)),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      // Delete the overwritten file
      await FileSystem.deleteAsync(mediaUri, { idempotent: true });
      
      // Verify deletion
      const verifyDeletion = await FileSystem.getInfoAsync(mediaUri);
      return !verifyDeletion.exists;
    } catch (error) {
      console.error('Error wiping local media:', error);
      return false;
    }
  }

  async logWipeEvent(mediaInfo: {
    originalUri: string;
    uploadedUrl: string;
    recordType: string;
    recordId: string;
  }): Promise<void> {
    try {
      await supabase.from('media_uploads').insert([{
        file_path: mediaInfo.originalUri,
        public_url: mediaInfo.uploadedUrl,
        related_record_type: mediaInfo.recordType,
        related_record_id: mediaInfo.recordId,
        upload_status: 'completed',
        processing_status: 'completed',
        metadata: {
          wiped_at: new Date().toISOString(),
          wipe_status: 'success',
          wipe_method: 'secure_overwrite'
        }
      }]);
    } catch (error) {
      console.error('Error logging wipe event:', error);
    }
  }

  async handleUploadSuccess(
    localUri: string,
    uploadedUrl: string,
    recordType: string,
    recordId: string
  ): Promise<void> {
    try {
      // Wipe the local file
      const wipeSuccess = await this.wipeLocalMedia(localUri);

      // Log the wipe event
      await this.logWipeEvent({
        originalUri: localUri,
        uploadedUrl,
        recordType,
        recordId
      });

      if (!wipeSuccess) {
        console.warn('Failed to wipe local media:', localUri);
      }
    } catch (error) {
      console.error('Error handling upload success:', error);
    }
  }

  async cleanupOrphanedMedia(): Promise<void> {
    try {
      const cacheDirectory = FileSystem.cacheDirectory;
      if (!cacheDirectory) return;

      // Get list of files in cache directory
      const files = await FileSystem.readDirectoryAsync(cacheDirectory);

      // Filter for media files
      const mediaFiles = files.filter(file => 
        file.endsWith('.mp4') || 
        file.endsWith('.jpg') || 
        file.endsWith('.png')
      );

      // Wipe each file
      for (const file of mediaFiles) {
        const filePath = `${cacheDirectory}${file}`;
        await this.wipeLocalMedia(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up orphaned media:', error);
    }
  }
}

export default AutoWipeManager;