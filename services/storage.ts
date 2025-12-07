
import { ChatSession, GalleryItem } from '../types';

// Helper to generate user-specific keys
const getUserKey = (userId: string, key: string) => `${key}_${userId}`;

const KEYS = {
  SESSIONS: 'wanderai_sessions',
  GALLERY: 'wanderai_gallery',
  USER_PREFS: 'wanderai_prefs'
};

// --- CHAT SESSIONS ---

export const loadSessions = (userId: string): ChatSession[] => {
  try {
    const key = getUserKey(userId, KEYS.SESSIONS);
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    // Parse and revive Date objects
    const sessions = JSON.parse(data, (k, value) => {
      if (k === 'timestamp' || k === 'updatedAt') {
        return new Date(value);
      }
      return value;
    });
    
    return sessions;
  } catch (error) {
    console.error("Failed to load sessions:", error);
    return [];
  }
};

export const saveSessions = (userId: string, sessions: ChatSession[]) => {
  try {
    const key = getUserKey(userId, KEYS.SESSIONS);
    // Simple save for sessions (text is usually small enough)
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (error) {
    console.error("Failed to save sessions:", error);
  }
};

// --- MEDIA GALLERY ---

export const loadGallery = (userId: string): GalleryItem[] => {
  try {
    const key = getUserKey(userId, KEYS.GALLERY);
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const gallery = JSON.parse(data, (k, value) => {
      if (k === 'timestamp') {
        return new Date(value);
      }
      return value;
    });
    
    return gallery;
  } catch (error) {
    console.error("Failed to load gallery:", error);
    return [];
  }
};

export const saveGallery = (userId: string, gallery: GalleryItem[]) => {
  const key = getUserKey(userId, KEYS.GALLERY);
  
  const trySave = (items: GalleryItem[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error: any) {
      // Check for quota exceeded error
      if (
        (error.name === 'QuotaExceededError' || 
         error.code === 22 || 
         error.message?.toLowerCase().includes('quota')) && 
        items.length > 0
      ) {
        // Recursively remove the last item (oldest) and try saving again
        console.warn("Storage full, removing oldest item...");
        const truncatedGallery = items.slice(0, -1);
        trySave(truncatedGallery);
      } else {
        console.error("Failed to save gallery:", error);
      }
    }
  };

  trySave(gallery);
};
