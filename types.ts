export interface GeneratedPost {
  text: string;
  // imageUrl: string; // Removed as per request
}

export enum Status {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

export interface RssItem {
  id: string; // Use link as a unique ID
  title: string;
  link: string;
  description: string;
  pubDate?: string;
}