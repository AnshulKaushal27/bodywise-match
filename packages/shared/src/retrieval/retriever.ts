/**
 * Retrieval Engine for Bodywise Match RAG Layer
 * Task Part C
 *
 * Provides BM25 lexical retrieval with controlled concept expansion
 * and optional local embedding fusion (behind ENABLE_EMBEDDINGS=false).
 */

import MiniSearch from "minisearch";
import { KNOWLEDGE_CARDS_SEED, KnowledgeCard } from "../data/knowledge.seed";
import { CONCEPTS_BY_ID } from "./concepts";
import { ParsedNeed } from "../matcher/types";

export interface RetrievalCandidate {
  productId: string;
  slug: string;
  name: string;
  category: string;
  format: string;
  bm25Score: number;
  conceptHits: string[];
  evidenceSnippets: string[];
}

export interface Retriever {
  retrieve(need: ParsedNeed, k?: number): Promise<RetrievalCandidate[]>;
}

interface IndexedDoc {
  id: string; // productId
  slug: string;
  name: string;
  category: string;
  format: string;
  text: string;
  concept_labels: string;
  synonyms: string;
  concepts: string[];
  concept_evidence: Record<string, string>;
}

export class BM25KnowledgeRetriever implements Retriever {
  private miniSearch: MiniSearch<IndexedDoc>;
  private cardsByProductId: Map<string, KnowledgeCard>;
  private enableEmbeddings: boolean;
  private precomputedEmbeddings: Record<string, number[]> | null = null;

  constructor(cards: KnowledgeCard[] = KNOWLEDGE_CARDS_SEED) {
    this.cardsByProductId = new Map(cards.map((c) => [c.productId, c]));
    this.enableEmbeddings = process.env.ENABLE_EMBEDDINGS === "true";

    this.miniSearch = new MiniSearch<IndexedDoc>({
      fields: ["concept_labels", "synonyms", "name", "text", "category", "format"],
      storeFields: ["id", "slug", "name", "category", "format", "concepts", "concept_evidence"],
      searchOptions: {
        boost: {
          concept_labels: 3.5,
          name: 2.5,
          synonyms: 2.0,
          category: 1.5,
          text: 1.0,
        },
        prefix: true,
        fuzzy: 0.15,
        combineWith: "OR",
      },
    });

    const docs: IndexedDoc[] = cards.map((c) => {
      const conceptObjs = c.concepts.map((cid) => CONCEPTS_BY_ID.get(cid)).filter(Boolean);
      const conceptLabels = conceptObjs.map((co) => co!.label).join(" ");
      const synonyms = conceptObjs.flatMap((co) => co!.synonyms).join(" ");

      return {
        id: c.productId,
        slug: c.slug,
        name: c.name,
        category: c.category,
        format: c.format,
        text: c.text,
        concept_labels: conceptLabels,
        synonyms: synonyms,
        concepts: c.concepts,
        concept_evidence: c.concept_evidence,
      };
    });

    this.miniSearch.addAll(docs);

    // Optional embeddings loading if enabled (Node runtime only)
    if (this.enableEmbeddings && typeof window === "undefined") {
      try {
        const nodeFs = eval("require")("fs");
        const nodePath = eval("require")("path");
        const embPath = nodePath.resolve(process.cwd(), "data/knowledge/embeddings.json");
        if (nodeFs.existsSync(embPath)) {
          this.precomputedEmbeddings = JSON.parse(nodeFs.readFileSync(embPath, "utf-8"));
        }
      } catch {
        // Silently fallback to BM25 only per Part C.2
        this.precomputedEmbeddings = null;
      }
    }
  }

  public async retrieve(need: ParsedNeed, k: number = 6): Promise<RetrievalCandidate[]> {
    // 1. Build expanded query terms from user phrase + need concepts + synonyms
    const queryParts: string[] = [need.phrase_from_user];

    for (const cid of need.concepts) {
      const cDef = CONCEPTS_BY_ID.get(cid);
      if (cDef) {
        queryParts.push(cDef.label);
        queryParts.push(cDef.synonyms.slice(0, 3).join(" "));
      }
    }

    if (need.preferred_category) {
      queryParts.push(need.preferred_category);
    }

    const queryString = queryParts.join(" ").replace(/[^\w\s-]/g, " ").trim();

    // 2. Execute BM25 search
    const results = this.miniSearch.search(queryString);

    // 3. Map and extract concept hits & evidence snippets
    const candidates: RetrievalCandidate[] = [];
    const seenProductIds = new Set<string>();

    for (const r of results) {
      const card = this.cardsByProductId.get(r.id);
      if (!card) continue;
      if (seenProductIds.has(r.id)) continue;
      seenProductIds.add(r.id);

      // Check which need concepts this card has evidence for
      const conceptHits = need.concepts.filter((cid) => card.concepts.includes(cid));
      const evidenceSnippets = conceptHits
        .map((cid) => card.concept_evidence[cid])
        .filter(Boolean);

      candidates.push({
        productId: card.productId,
        slug: card.slug,
        name: card.name,
        category: card.category,
        format: card.format,
        bm25Score: r.score,
        conceptHits,
        evidenceSnippets,
      });

      if (candidates.length >= k * 2) {
        break;
      }
    }

    // If BM25 didn't find enough, backfill from concept index directly
    if (candidates.length < k && need.concepts.length > 0) {
      for (const card of Array.from(this.cardsByProductId.values())) {
        if (seenProductIds.has(card.productId)) continue;

        const conceptHits = need.concepts.filter((cid) => card.concepts.includes(cid));
        if (conceptHits.length > 0) {
          seenProductIds.add(card.productId);
          candidates.push({
            productId: card.productId,
            slug: card.slug,
            name: card.name,
            category: card.category,
            format: card.format,
            bm25Score: 0.5,
            conceptHits,
            evidenceSnippets: conceptHits.map((cid) => card.concept_evidence[cid]).filter(Boolean),
          });
        }
        if (candidates.length >= k) break;
      }
    }

    // Sort by conceptHits length (most evidence first), then category fit, then score
    candidates.sort((a, b) => {
      if (a.conceptHits.length !== b.conceptHits.length) {
        return b.conceptHits.length - a.conceptHits.length;
      }
      if (need.preferred_category) {
        const aCatMatch = a.category === need.preferred_category ? 1 : 0;
        const bCatMatch = b.category === need.preferred_category ? 1 : 0;
        if (aCatMatch !== bCatMatch) return bCatMatch - aCatMatch;
      }
      return b.bm25Score - a.bm25Score;
    });

    return candidates.slice(0, k);
  }
}

// Singleton instance for in-process retrieval
export const defaultRetriever: Retriever = new BM25KnowledgeRetriever();
