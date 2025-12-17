export interface SunoPrompt {
  title?: string;
  lyrics?: string;
  style?: {
    genre?: string[];
    mood?: string[];
    vocals?: string;
    tempo?: string;
    instruments?: string[];
  };
  structure?: {
    sections?: Array<{
      type?: string;
      lyrics?: string;
      duration?: string;
    }>;
  };
  references?: {
    similar_to?: string[];
    era?: string;
  };
  production?: {
    energy?: string;
    production_style?: string;
  };
}

