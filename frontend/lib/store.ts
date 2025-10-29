import { create } from 'zustand';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  featuredImage?: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  likes: number;
  commentsCount?: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface AppState {
  // Articles
  articles: Article[];
  setArticles: (articles: Article[]) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // UI State
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  
  // Newsletter
  newsletterEmail: string;
  setNewsletterEmail: (email: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // Articles
  articles: [],
  setArticles: (articles) => set({ articles }),
  
  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // UI State
  isSearchOpen: false,
  setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  
  // Newsletter
  newsletterEmail: '',
  setNewsletterEmail: (email) => set({ newsletterEmail: email }),
}));
