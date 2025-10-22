interface MentorLens {
  id: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
}

interface MentorLensState {
  lenses: MentorLens[];
  activeLens: MentorLens | null;
  loading: boolean;
  error: string | null;
}