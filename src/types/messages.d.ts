interface Message {
  id: string;
  content: string;
  timestamp: number;
  sender: string;
  type: 'text' | 'image' | 'video';
}

interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}