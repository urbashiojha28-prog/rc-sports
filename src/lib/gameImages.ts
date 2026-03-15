export const getGameImage = (url: string | null): string => {
  const placeholder = "https://images.unsplash.com/photo-1461896756970-17e914046d90?q=80&w=2070&auto=format&fit=crop";
  if (!url) return placeholder;
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return url;
};
