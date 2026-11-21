"use client";

import * as React from "react";
import { useSearchParams, usePathname } from "next/navigation";
import {
  ProductFilterCriteria,
  normalizeToken,
  CONTROLLED_GOALS,
  parseSearchToFilterParams,
} from "@bodywise/shared";

export const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "body_wash", label: "Body Wash & Scrubs" },
  { id: "face_wash", label: "Face Wash" },
  { id: "moisturizer", label: "Moisturizer & Body Lotion" },
  { id: "serum", label: "Serums & Treatments" },
  { id: "roll_on", label: "Deodorant & Roll-On" },
  { id: "shampoo", label: "Shampoo" },
  { id: "conditioner", label: "Conditioner" },
  { id: "sunscreen", label: "Sunscreen" },
  { id: "supplement", label: "Gummies & Supplements" },
  { id: "kit", label: "Kits & Combos" },
  { id: "accessory", label: "Tools & Accessories" },
];

export const FORMAT_OPTIONS = [
  { id: "all", label: "All Formats" },
  { id: "liquid", label: "Liquid" },
  { id: "gel", label: "Gel & Foam" },
  { id: "cream", label: "Cream & Lotion" },
  { id: "serum", label: "Serum & Drops" },
  { id: "roll-on", label: "Roll-On Applicator" },
  { id: "spray", label: "Spray & Mist" },
  { id: "gummies", label: "Chewable Gummies" },
  { id: "scrub", label: "Exfoliating Scrub" },
];

export const FRAGRANCE_OPTIONS = [
  { id: "all", label: "All Formulations" },
  { id: "fragrance_free", label: "Fragrance-Free Only" },
  { id: "other", label: "Fragrance / Unverified" },
];

export interface ActiveFilterChip {
  id: string;
  groupId: "category" | "format" | "goal" | "fragrance";
  groupLabel: string;
  label: string;
}

export function useProductFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Parse initial state from URL search params
  const parseFromUrl = React.useCallback((): ProductFilterCriteria => {
    if (!searchParams) return { search: "", categories: [], formats: [], goals: [], fragrance: "all" };

    // Search query
    const rawQ = searchParams.get("q") || "";
    let q = rawQ.trim();

    // Categories (supports ?category=face-wash,body-wash or ?category=face_wash)
    const rawCategories = searchParams.getAll("category").flatMap((c) => c.split(","));
    const categories = rawCategories
      .map(normalizeToken)
      .filter((c) => c && c !== "all");

    // Formats
    const rawFormats = searchParams.getAll("format").flatMap((f) => f.split(","));
    const formats = rawFormats
      .map((f) => f.trim().toLowerCase())
      .filter((f) => f && f !== "all");

    // Goals (supports ?goal=oil-sebum-balance or ?goal=oil_control)
    const rawGoals = searchParams.getAll("goal").flatMap((g) => g.split(","));
    const goals = rawGoals
      .map(normalizeToken)
      .filter((g) => g && g !== "all");

    // Fragrance (supports ?fragrance=free or ?fragrance=fragrance_free)
    let fragrance = "all";
    const rawFragrance = searchParams.get("fragrance");
    if (rawFragrance) {
      const normFrag = rawFragrance.toLowerCase().trim();
      if (normFrag === "free" || normFrag === "fragrance_free" || normFrag === "fragrance-free") {
        fragrance = "fragrance_free";
      } else if (normFrag === "other" || normFrag === "unverified") {
        fragrance = "other";
      }
    }

    // Sanitize q if it contains natural language filler or parsed filters
    if (q.length > 0) {
      const parsedQ = parseSearchToFilterParams(q);
      for (const g of parsedQ.goals) {
        if (!goals.includes(g)) goals.push(g);
      }
      for (const c of parsedQ.categories) {
        if (!categories.includes(c)) categories.push(c);
      }
      for (const f of parsedQ.formats) {
        if (!formats.includes(f)) formats.push(f);
      }
      if (parsedQ.fragrance !== "all" && fragrance === "all") {
        fragrance = parsedQ.fragrance;
      }

      if (parsedQ.search !== undefined) {
        q = parsedQ.search;
      } else if (goals.length > 0 || categories.length > 0 || formats.length > 0 || fragrance !== "all") {
        // Filters are active and the remaining query was pure filler; clear search so it doesn't break the filters
        q = "";
      }
    }

    return {
      search: q,
      categories,
      formats,
      goals,
      fragrance,
    };
  }, [searchParams]);

  const initial = React.useMemo(() => parseFromUrl(), [parseFromUrl]);

  const [searchQuery, setSearchQuery] = React.useState<string>(initial.search || "");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(initial.categories || []);
  const [selectedFormats, setSelectedFormats] = React.useState<string[]>(initial.formats || []);
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>(initial.goals || []);
  const [selectedFragrance, setSelectedFragrance] = React.useState<string>(initial.fragrance || "all");

  // Keep internal state in sync if URL searchParams change externally (e.g. back/forward navigation)
  React.useEffect(() => {
    const parsed = parseFromUrl();
    setSearchQuery(parsed.search || "");
    setSelectedCategories(parsed.categories || []);
    setSelectedFormats(parsed.formats || []);
    setSelectedGoals(parsed.goals || []);
    setSelectedFragrance(parsed.fragrance || "all");
  }, [parseFromUrl]);

  // Debounced URL writer for smooth search without spamming history
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const syncToUrl = React.useCallback(
    (nextState: {
      search: string;
      categories: string[];
      formats: string[];
      goals: string[];
      fragrance: string;
    }) => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams();

      if (nextState.search.trim().length > 0) {
        params.set("q", nextState.search.trim());
      }
      if (nextState.categories.length > 0) {
        params.set("category", nextState.categories.join(","));
      }
      if (nextState.formats.length > 0) {
        params.set("format", nextState.formats.join(","));
      }
      if (nextState.goals.length > 0) {
        params.set("goal", nextState.goals.join(","));
      }
      if (nextState.fragrance && nextState.fragrance !== "all") {
        params.set("fragrance", nextState.fragrance);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Update URL silently without triggering router refresh
      window.history.replaceState(null, "", newUrl);
    },
    [pathname]
  );

  // Sync state changes to URL
  const updateFiltersAndSync = React.useCallback(
    (updates: {
      search?: string;
      categories?: string[];
      formats?: string[];
      goals?: string[];
      fragrance?: string;
    }) => {
      const nextSearch = updates.search !== undefined ? updates.search : searchQuery;
      const nextCats = updates.categories !== undefined ? updates.categories : selectedCategories;
      const nextFmts = updates.formats !== undefined ? updates.formats : selectedFormats;
      const nextGoals = updates.goals !== undefined ? updates.goals : selectedGoals;
      const nextFrag = updates.fragrance !== undefined ? updates.fragrance : selectedFragrance;

      if (updates.search !== undefined) setSearchQuery(nextSearch);
      if (updates.categories !== undefined) setSelectedCategories(nextCats);
      if (updates.formats !== undefined) setSelectedFormats(nextFmts);
      if (updates.goals !== undefined) setSelectedGoals(nextGoals);
      if (updates.fragrance !== undefined) setSelectedFragrance(nextFrag);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // If search query is changed, debounce URL update; otherwise sync immediately
      if (updates.search !== undefined) {
        debounceTimerRef.current = setTimeout(() => {
          syncToUrl({
            search: nextSearch,
            categories: nextCats,
            formats: nextFmts,
            goals: nextGoals,
            fragrance: nextFrag,
          });
        }, 250);
      } else {
        syncToUrl({
          search: nextSearch,
          categories: nextCats,
          formats: nextFmts,
          goals: nextGoals,
          fragrance: nextFrag,
        });
      }
    },
    [searchQuery, selectedCategories, selectedFormats, selectedGoals, selectedFragrance, syncToUrl]
  );

  // Clean up debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Compute active chips list
  const activeChips = React.useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    // Categories
    for (const catId of selectedCategories) {
      const found = CATEGORIES.find((c) => normalizeToken(c.id) === normalizeToken(catId));
      chips.push({
        id: catId,
        groupId: "category",
        groupLabel: "Category",
        label: found ? found.label : catId.replace(/_/g, " "),
      });
    }

    // Formats
    for (const fmtId of selectedFormats) {
      const found = FORMAT_OPTIONS.find((f) => f.id.toLowerCase() === fmtId.toLowerCase());
      chips.push({
        id: fmtId,
        groupId: "format",
        groupLabel: "Format",
        label: found ? found.label : fmtId,
      });
    }

    // Goals
    for (const goalId of selectedGoals) {
      const found = CONTROLLED_GOALS.find((g) => normalizeToken(g.id) === normalizeToken(goalId));
      chips.push({
        id: goalId,
        groupId: "goal",
        groupLabel: "Goal",
        label: found ? found.label : goalId.replace(/_/g, " "),
      });
    }

    // Fragrance
    if (selectedFragrance !== "all") {
      const found = FRAGRANCE_OPTIONS.find((f) => f.id === selectedFragrance);
      chips.push({
        id: selectedFragrance,
        groupId: "fragrance",
        groupLabel: "Fragrance",
        label: found ? found.label : selectedFragrance,
      });
    }

    return chips;
  }, [selectedCategories, selectedFormats, selectedGoals, selectedFragrance]);

  const activeFilterCount = activeChips.length;

  // Handlers for individual removals
  const removeFilter = React.useCallback(
    (groupId: "category" | "format" | "goal" | "fragrance", id: string) => {
      if (groupId === "category") {
        const next = selectedCategories.filter((c) => normalizeToken(c) !== normalizeToken(id));
        updateFiltersAndSync({ categories: next });
      } else if (groupId === "format") {
        const next = selectedFormats.filter((f) => f.toLowerCase() !== id.toLowerCase());
        updateFiltersAndSync({ formats: next });
      } else if (groupId === "goal") {
        const next = selectedGoals.filter((g) => normalizeToken(g) !== normalizeToken(id));
        updateFiltersAndSync({ goals: next });
      } else if (groupId === "fragrance") {
        updateFiltersAndSync({ fragrance: "all" });
      }
    },
    [selectedCategories, selectedFormats, selectedGoals, updateFiltersAndSync]
  );

  // Clear all filters
  const clearAllFilters = React.useCallback(() => {
    updateFiltersAndSync({
      search: "",
      categories: [],
      formats: [],
      goals: [],
      fragrance: "all",
    });
  }, [updateFiltersAndSync]);

  // Apply natural language query to filters
  const applySearchPhrase = React.useCallback(
    (phrase: string) => {
      const parsed = parseSearchToFilterParams(phrase);
      updateFiltersAndSync({
        search: parsed.search !== undefined ? parsed.search : "",
        categories: parsed.categories.length > 0 ? parsed.categories : [],
        formats: parsed.formats.length > 0 ? parsed.formats : [],
        goals: parsed.goals.length > 0 ? parsed.goals : [],
        fragrance: parsed.fragrance !== "all" ? parsed.fragrance : "all",
      });
    },
    [updateFiltersAndSync]
  );

  // Current criteria bundle for pure filterProducts()
  const filterCriteria: ProductFilterCriteria = React.useMemo(() => {
    return {
      search: searchQuery,
      categories: selectedCategories,
      formats: selectedFormats,
      goals: selectedGoals,
      fragrance: selectedFragrance,
    };
  }, [searchQuery, selectedCategories, selectedFormats, selectedGoals, selectedFragrance]);

  return {
    searchQuery,
    setSearchQuery: (q: string) => updateFiltersAndSync({ search: q }),
    applySearchPhrase,
    selectedCategories,
    selectedFormats,
    selectedGoals,
    selectedFragrance,
    filterCriteria,
    activeChips,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0 || searchQuery.trim().length > 0,
    removeFilter,
    clearAllFilters,
    updateFiltersAndSync,
  };
}
