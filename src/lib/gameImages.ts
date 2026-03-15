// Helper to handle game images
export const getGameImage = (url: string | null): string => {
  if (!url) return "/placeholder.svg"; // Fallback image
  
  // If it's already a full URL (from Supabase or External), use it
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  
  // Otherwise, assume it's a relative path from the assets folder
  return url;
};
