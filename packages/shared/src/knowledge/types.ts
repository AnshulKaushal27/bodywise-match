export interface FamilyDigestEntry {
  familyId: string;
  name: string;
  category: string;
  area: string;
  format: string;
  concepts: string[];
  fragrance_free: boolean | null;
  summary: string;
  verified: boolean;
  catalog_version: string;
}

export interface KnowledgeChunk {
  chunkId: string;
  familyId: string;
  variantIds: string[];
  category: string;
  subcategory: string | null;
  format: string;
  area: string;
  concepts: string[];
  fragrance_free: boolean | null;
  is_demo: boolean;
  source_url: string | null;
  last_verified_at: string | null;
  catalog_version: string;
  chunk_type: "description" | "ingredients" | "directions" | "claims";
  text: string;
}

export interface SupportKnowledgeChunk {
  id: string;
  title: string;
  description: string;
  type: "email" | "chat" | "portal" | "phone";
  target_url: string;
  source: string;
  last_checked: string;
  recommended_for: string;
  text: string;
}

export interface SearchFilters {
  category?: string;
  area?: string;
  concepts?: string[];
  fragrance?: string;
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  collection: "products" | "support";
  k?: number;
}

export interface MatchedChunkSnippet {
  chunkId: string;
  chunkType: string;
  text: string;
  snippet: string;
}

export interface KnowledgeSearchResult {
  familyId?: string;
  id?: string;
  score: number;
  matchedChunks: MatchedChunkSnippet[];
  category?: string;
  title?: string;
  sourceUrl?: string;
}
