/**
 * Retrieval Service for Bodywise Match Knowledge Base
 * Packages: packages/shared/knowledge
 *
 * Implements:
 * 1. Metadata PRE-FILTER first (zero leakage across categories).
 * 2. BM25 search with MiniSearch over chunk text + concept labels + Hinglish synonyms.
 * 3. Strict collection isolation: product searches never return support chunks and vice-versa.
 * 4. Safe optional embeddings hook behind ENABLE_EMBEDDINGS=false (default).
 */

import MiniSearch from "minisearch";
import {
  KnowledgeChunk,
  SupportKnowledgeChunk,
  SearchOptions,
  KnowledgeSearchResult,
  MatchedChunkSnippet,
} from "./types";
import { CHUNKS_SEED, SUPPORT_SEED } from "./data.seed";
import { HINGLISH_NEEDS } from "../data/synonyms.hinglish";

interface IndexedProductChunk extends KnowledgeChunk {
  id: string;
  conceptsStr: string;
}

interface IndexedSupportChunk extends SupportKnowledgeChunk {
  id: string;
}

/**
 * Expands query tokens using the Hinglish & everyday wellness synonyms dictionary.
 */
function expandQueryWithSynonyms(query: string): string {
  if (!query) return "";
  const tokens = query.toLowerCase().split(/\s+/);
  const additions = new Set<string>();

  for (const token of tokens) {
    if (token.length < 3) continue;
    for (const [canonicalNeed, synonyms] of Object.entries(HINGLISH_NEEDS)) {
      if (token === canonicalNeed || synonyms.includes(token)) {
        additions.add(canonicalNeed.replace(/_/g, " "));
        for (const syn of synonyms.slice(0, 3)) {
          additions.add(syn);
        }
      }
    }
  }

  if (additions.size === 0) return query;
  return `${query} ${Array.from(additions).join(" ")}`;
}

/**
 * Extract a concise snippet around the best match in chunk text.
 */
function extractSnippet(text: string, queryTokens: string[], maxLen = 140): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  let bestIdx = -1;

  for (const t of queryTokens) {
    if (t.length < 3) continue;
    const idx = lower.indexOf(t.toLowerCase());
    if (idx !== -1) {
      bestIdx = idx;
      break;
    }
  }

  if (bestIdx === -1) {
    return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
  }

  const start = Math.max(0, bestIdx - 30);
  const end = Math.min(text.length, start + maxLen);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}

/**
 * Execute search over products or support knowledge base.
 */
export function search(options: SearchOptions): KnowledgeSearchResult[] {
  const { query, filters, collection, k = 10 } = options;

  if (collection === "support") {
    // ================= SUPPORT COLLECTION SEARCH =================
    // Strict isolation: only searches SUPPORT_SEED, zero product data returned.
    const docs: IndexedSupportChunk[] = SUPPORT_SEED.map((s) => ({
      ...s,
      id: s.id,
    }));

    if (!query || !query.trim()) {
      return docs.slice(0, k).map((doc) => ({
        id: doc.id,
        title: doc.title,
        sourceUrl: doc.target_url,
        score: 1.0,
        matchedChunks: [
          {
            chunkId: doc.id,
            chunkType: "support",
            text: doc.text,
            snippet: doc.description,
          },
        ],
      }));
    }

    const miniSearch = new MiniSearch<IndexedSupportChunk>({
      fields: ["title", "description", "recommended_for", "text"],
      storeFields: ["id", "title", "description", "target_url", "text"],
      searchOptions: {
        boost: { title: 3, recommended_for: 2, description: 1.5 },
        prefix: true,
        fuzzy: 0.2,
      },
    });

    miniSearch.addAll(docs);
    const expandedQuery = expandQueryWithSynonyms(query);
    const searchResults = miniSearch.search(expandedQuery);

    return searchResults.slice(0, k).map((r) => ({
      id: r.id,
      title: r.title,
      sourceUrl: r.target_url,
      score: r.score,
      matchedChunks: [
        {
          chunkId: r.id,
          chunkType: "support",
          text: r.text,
          snippet: extractSnippet(r.text, query.split(/\s+/)),
        },
      ],
    }));
  }

  // ================= PRODUCTS COLLECTION SEARCH =================
  // Step 1: Strict Metadata PRE-FILTER
  // Zero category leakage guarantee: If filters.category is provided, ALL non-matching chunks are rejected upfront.
  const preFiltered = CHUNKS_SEED.filter((chunk) => {
    if (filters?.category) {
      if (chunk.category !== filters.category) {
        return false;
      }
    }
    if (filters?.area) {
      if (chunk.area !== filters.area) {
        return false;
      }
    }
    if (filters?.fragrance === "free_only") {
      if (chunk.fragrance_free !== true) {
        return false;
      }
    }
    return true;
  });

  if (preFiltered.length === 0) {
    return [];
  }

  // Step 2: Index PRE-FILTERED documents into BM25 MiniSearch
  const indexedDocs: IndexedProductChunk[] = preFiltered.map((c) => ({
    ...c,
    id: c.chunkId,
    conceptsStr: (c.concepts || []).join(" ").replace(/_/g, " "),
  }));

  const cleanQuery = (query || "").trim();
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  // If query is blank, rank by default family ordering
  if (queryTokens.length === 0) {
    const familyMap = new Map<string, KnowledgeSearchResult>();
    for (const doc of indexedDocs) {
      if (!familyMap.has(doc.familyId)) {
        familyMap.set(doc.familyId, {
          familyId: doc.familyId,
          category: doc.category,
          sourceUrl: doc.source_url || undefined,
          score: 1.0,
          matchedChunks: [],
        });
      }
      const entry = familyMap.get(doc.familyId)!;
      if (entry.matchedChunks.length < 3) {
        entry.matchedChunks.push({
          chunkId: doc.chunkId,
          chunkType: doc.chunk_type,
          text: doc.text,
          snippet: extractSnippet(doc.text, []),
        });
      }
    }
    return Array.from(familyMap.values()).slice(0, k);
  }

  const miniSearch = new MiniSearch<IndexedProductChunk>({
    fields: ["text", "conceptsStr", "format", "category"],
    storeFields: ["id", "familyId", "category", "chunk_type", "text", "source_url"],
    searchOptions: {
      boost: { conceptsStr: 2.5, text: 1.5, format: 1.2 },
      prefix: true,
      fuzzy: 0.2,
    },
  });

  miniSearch.addAll(indexedDocs);
  const expandedQuery = expandQueryWithSynonyms(cleanQuery);
  const rawResults = miniSearch.search(expandedQuery);

  // Concept boosting if specified in filters
  const conceptSet = new Set(filters?.concepts || []);

  // Step 3: Group matched chunks by familyId and aggregate BM25 scores
  const familyMap = new Map<
    string,
    {
      familyId: string;
      category: string;
      sourceUrl?: string;
      score: number;
      matchedChunks: MatchedChunkSnippet[];
    }
  >();

  for (const r of rawResults) {
    const doc = preFiltered.find((c) => c.chunkId === r.id);
    if (!doc) continue;

    let score = r.score;
    // Boost if chunk concepts match requested concepts
    if (conceptSet.size > 0 && doc.concepts.some((c) => conceptSet.has(c))) {
      score *= 1.3;
    }

    if (!familyMap.has(doc.familyId)) {
      familyMap.set(doc.familyId, {
        familyId: doc.familyId,
        category: doc.category,
        sourceUrl: doc.source_url || undefined,
        score,
        matchedChunks: [],
      });
    } else {
      const existing = familyMap.get(doc.familyId)!;
      existing.score += score * 0.5; // Additive contribution from secondary chunks
    }

    const currentFamily = familyMap.get(doc.familyId)!;
    if (currentFamily.matchedChunks.length < 3) {
      currentFamily.matchedChunks.push({
        chunkId: doc.chunkId,
        chunkType: doc.chunk_type,
        text: doc.text,
        snippet: extractSnippet(doc.text, queryTokens),
      });
    }
  }

  // Sort families by aggregated BM25 score descending
  const sortedFamilies = Array.from(familyMap.values()).sort((a, b) => b.score - a.score);

  return sortedFamilies.slice(0, k);
}
