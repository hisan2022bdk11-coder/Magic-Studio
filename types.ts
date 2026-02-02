
export type AppLanguage = 'en' | 'id';

export type MenuId = 
  | 'home' 
  | 'text-to-image' 
  | 'image-to-image' 
  | 'photorealistic-portrait'
  | 'sticker-design' 
  | 'logo-creator' 
  | 'product-mockup' 
  | 'sequential-art' 
  | 'smart-editor' 
  | 'style-transfer' 
  | 'fashion-composite' 
  | 'sketch-to-real' 
  | 'character-lab' 
  | 'live-visuals' 
  | 'recipe-extractor' 
  | 'chat';

export interface ChatPart {
  type: 'text' | 'image';
  text?: string;
  url?: string;
  thought?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatPart[];
}

export interface RecipeResult {
  recipe_name: string;
  prep_time_minutes: number;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
}
