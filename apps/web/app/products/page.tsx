"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MagnifyingGlass,
  X,
  SlidersHorizontal,
  Drop,
  Flask,
  Wind,
  Sun,
  Pill,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import {
  Card,
  Button,
  EmptyState,
} from "@/components/ui";
import {
  ProductRecord,
  DEMO_CATALOGUE_SEED,
  CONTROLLED_GOALS,
  filterProducts,
  ProductFilterCriteria,
} from "@bodywise/shared";
import { fetchProducts } from "@/lib/api";
import {
  useProductFilters,
  CATEGORIES,
} from "@/hooks/useProductFilters";
import { FilterDialog } from "./FilterDialog";

// Helper for Category Icon
function getProductTypeIcon(category: string) {
  switch (category) {
    case "body_wash":
    case "face_wash":
      return <Drop className="w-6 h-6 text-brand-evergreen" weight="regular" aria-hidden="true" />;
    case "serum":
    case "roll_on":
      return <Flask className="w-6 h-6 text-brand-evergreen" weight="regular" aria-hidden="true" />;
    case "shampoo":
    case "conditioner":
    case "hair_oil":
      return <Wind className="w-6 h-6 text-brand-evergreen" weight="regular" aria-hidden="true" />;
    case "sunscreen":
      return <Sun className="w-6 h-6 text-brand-evergreen" weight="regular" aria-hidden="true" />;
    case "supplement":
      return <Pill className="w-6 h-6 text-brand-evergreen" weight="regular" aria-hidden="true" />;
    default:
      return <Sparkle className="w-6 h-6 text-brand-evergreen" weight="regular" aria-hidden="true" />;
  }
}

interface ProductCardItemProps {
  product: ProductRecord;
  isCompared: boolean;
  onToggleCompare: (id: string) => void;
  isNonMatching?: boolean;
}

function ProductCardItem({
  product,
  isCompared,
  onToggleCompare,
  isNonMatching = false,
}: ProductCardItemProps) {
  const categoryLabel =
    CATEGORIES.find((c) => c.id === product.category)?.label ||
    product.category.replace(/_/g, " ");

  return (
    <Card
      key={product.id}
      variant="surface"
      className={`p-5 md:p-6 shadow-sm hover:shadow-card transition-all duration-150 border flex flex-col justify-between group ${
        isNonMatching
          ? "border-border/70 bg-surface/90 hover:bg-surface hover:border-border"
          : "border-border bg-surface"
      }`}
    >
      <div>
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-border/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-sage/60 text-brand-deep capitalize">
              {categoryLabel}
            </span>
            {isNonMatching && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-paper text-muted border border-border">
                Outside active filter
              </span>
            )}
          </div>

          {/* Compare Checkbox */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-muted hover:text-brand-evergreen select-none">
            <input
              type="checkbox"
              checked={isCompared}
              onChange={() => onToggleCompare(product.id)}
              className="w-3.5 h-3.5 rounded text-brand-evergreen focus:ring-brand-evergreen border-border cursor-pointer"
            />
            <span>Compare</span>
          </label>
        </div>

        {/* Thumbnail & Title */}
        <div className="flex items-start gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-card bg-surface-sage/40 border border-border/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.official_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              getProductTypeIcon(product.category)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-base md:text-lg text-brand-deep leading-snug truncate">
              <Link
                href={`/products/${product.slug}`}
                className="hover:text-brand-evergreen focus-ring rounded"
              >
                {product.official_name}
              </Link>
            </h3>
            <p className="text-xs text-muted font-medium mt-0.5">
              {product.format} &bull; {product.size}
            </p>
          </div>
        </div>

        {/* Description excerpt */}
        <p className="text-xs text-charcoal/80 line-clamp-2 leading-relaxed mb-3.5">
          {product.official_description}
        </p>

        {/* Supported Goals Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.supported_goals.slice(0, 2).map((gId) => {
            const goalDef = CONTROLLED_GOALS.find((g) => g.id === gId);
            const label = goalDef?.label || gId.replace(/_/g, " ");
            return (
              <span
                key={gId}
                className="text-[10.5px] px-2 py-0.5 rounded-full bg-paper text-charcoal border border-border"
              >
                {label}
              </span>
            );
          })}
          {product.supported_goals.length > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-paper text-muted border border-border">
              +{product.supported_goals.length - 2} more
            </span>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-evergreen" />
          <span>
            {product.fragrance_free === true
              ? "Fragrance-free"
              : product.fragrance_free === false
              ? "Contains fragrance"
              : "Fragrance unverified"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={product.source_url || `https://bebodywise.com/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-primary text-white hover:bg-brand-deep transition-colors focus-ring"
            title="Buy on official website"
          >
            <span>Buy</span>
            <ArrowSquareOut className="w-3 h-3" weight="bold" />
          </a>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-evergreen hover:text-brand-deep group-hover:translate-x-0.5 transition-transform focus-ring px-1.5 py-1 rounded"
          >
            <span>View details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function ProductsPageContent() {
  const [products, setProducts] = React.useState<ProductRecord[]>(DEMO_CATALOGUE_SEED);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = React.useState<boolean>(false);

  // Filters hook handling search, attributes, and URL search param synchronization
  const {
    searchQuery,
    setSearchQuery,
    applySearchPhrase,
    filterCriteria,
    activeChips,
    activeFilterCount,
    hasActiveFilters,
    removeFilter,
    clearAllFilters,
    updateFiltersAndSync,
  } = useProductFilters();

  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const resultsContainerRef = React.useRef<HTMLDivElement>(null);

  // Comparison selection state (up to 3 products)
  const [selectedForCompare, setSelectedForCompare] = React.useState<string[]>([]);

  // Fetch catalogue products on mount
  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchProducts();
        if (isMounted && data.length > 0) {
          setProducts(data);
        }
      } catch {
        // Fallback already defaults to DEMO_CATALOGUE_SEED
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();

    // Load comparison items from sessionStorage if available
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("bodywise_compare_ids");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setSelectedForCompare(parsed);
        }
      } catch {
        // Ignore JSON error
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync comparison items to sessionStorage
  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 3) {
          updated = [...prev.slice(1), id];
        } else {
          updated = [...prev, id];
        }
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("bodywise_compare_ids", JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Pure deterministic partitioning of catalogue products into matching vs non-matching
  const { matchingProducts, nonMatchingProducts } = React.useMemo(() => {
    if (!hasActiveFilters) {
      return {
        matchingProducts: products,
        nonMatchingProducts: [] as ProductRecord[],
      };
    }
    const matching = filterProducts(products, filterCriteria);
    const matchingIdSet = new Set(matching.map((p) => p.id));
    const nonMatching = products.filter((p) => !matchingIdSet.has(p.id));
    return {
      matchingProducts: matching,
      nonMatchingProducts: nonMatching,
    };
  }, [products, filterCriteria, hasActiveFilters]);

  // Apply handler from dialog
  const handleApplyFilters = (draft: ProductFilterCriteria) => {
    updateFiltersAndSync({
      categories: draft.categories,
      formats: draft.formats,
      goals: draft.goals,
      fragrance: draft.fragrance,
    });
    // Smooth scroll to results if user is lower down or on mobile
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Navigation */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring px-2 py-1 rounded transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <div className="w-14" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="max-w-container mx-auto px-5 py-8 md:py-12 flex-1 w-full">
        {/* Header Intro */}
        <div className="mb-6">
          <span className="text-xs uppercase tracking-wider font-bold text-brand-evergreen">
            Catalogue Directory
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display text-brand-deep tracking-tight mt-1 mb-3">
            Browse Product Catalogue
          </h1>
          <p className="text-sm md:text-base text-charcoal/80 max-w-2xl leading-relaxed">
            Explore verified product facts, packaging cautions, and transparency sources. Filter by your targeted concern, format, or ingredients.
          </p>
        </div>

        {/* Floating / Sticky Comparison Bar if products are chosen */}
        {selectedForCompare.length > 0 && (
          <div className="mb-6 p-4 rounded-card bg-surface border-2 border-brand-evergreen/40 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-brand-evergreen text-surface text-xs font-bold flex items-center justify-center">
                {selectedForCompare.length}
              </span>
              <span className="text-xs sm:text-sm font-bold text-brand-deep">
                {selectedForCompare.length} of 3 products chosen for comparison
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedForCompare([]);
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("bodywise_compare_ids");
                  }
                }}
                className="text-xs text-muted hover:text-charcoal underline focus-ring px-2 py-1"
              >
                Clear
              </button>
              <Link
                href={`/compare?ids=${selectedForCompare.join(",")}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-evergreen text-surface hover:bg-brand-deep px-4 py-2 rounded-button focus-ring shadow-sm transition-colors active:scale-[0.98] motion-safe:transition-transform"
              >
                <span>Compare Now</span>
                <ArrowRight className="w-3.5 h-3.5" weight="bold" />
              </Link>
            </div>
          </div>
        )}

        {/* Sticky Toolbar Row */}
        <section
          aria-label="Catalogue Search and Filter Toolbar"
          className="sticky top-[57px] z-20 bg-paper/95 backdrop-blur-sm pt-2 pb-3.5 border-b border-border mb-4 transition-colors"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <MagnifyingGlass
                className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="regular"
                aria-hidden="true"
              />
              <label htmlFor="catalogue-search-input" className="sr-only">
                Search by product name, goal, format, or ingredient
              </label>
              <input
                id="catalogue-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      applySearchPhrase(searchQuery.trim());
                    }
                  }
                }}
                placeholder="Search by product name, goal, format, or ingredient..."
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-surface border border-border text-charcoal text-sm focus-ring placeholder:text-muted/70 transition-colors shadow-sm min-h-[52px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal focus-ring p-1.5 rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" weight="bold" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Secondary Filters Button */}
            <button
              ref={filtersButtonRef}
              type="button"
              onClick={() => setIsFilterDialogOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isFilterDialogOpen}
              className="h-[52px] min-h-[52px] rounded-xl px-5 border border-border bg-surface text-brand-deep hover:bg-surface-sage/30 hover:border-brand-evergreen/50 active:scale-[0.98] focus-ring inline-flex items-center justify-center gap-2.5 font-bold text-sm transition-all shadow-sm shrink-0"
            >
              <SlidersHorizontal className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-accent-lime text-brand-deep rounded-full tracking-tight min-w-[20px] text-center shadow-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Chips Row (rendered only when filters are active) */}
          {activeChips.length > 0 && (
            <div
              className="flex flex-wrap items-center gap-2 pt-3 overflow-x-auto text-xs"
              role="region"
              aria-label="Active Filters"
            >
              <span className="text-muted font-medium text-[11px] uppercase tracking-wider mr-1">
                Active:
              </span>
              {activeChips.map((chip) => (
                <span
                  key={`${chip.groupId}-${chip.id}`}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-surface-sage/60 border border-border text-brand-deep font-semibold text-xs transition-colors"
                >
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter(chip.groupId, chip.id)}
                    aria-label={`Remove filter: ${chip.label}`}
                    className="p-1 rounded-full text-muted hover:text-brand-deep hover:bg-surface-sage focus-ring min-w-[28px] min-h-[28px] flex items-center justify-center transition-colors active:scale-[0.98]"
                  >
                    <X className="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-brand-evergreen hover:text-brand-deep underline focus-ring px-2 py-1 min-h-[44px] flex items-center ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </section>

        {/* Results Row */}
        <div
          ref={resultsContainerRef}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs md:text-sm text-muted font-medium">
              Showing <strong className="text-brand-deep">{matchingProducts.length}</strong>{" "}
              {matchingProducts.length === 1 ? "product" : "products"}
              {hasActiveFilters && (
                <span>
                  {" "}matching active filters
                  {nonMatchingProducts.length > 0 && (
                    <span className="text-muted/80"> ({nonMatchingProducts.length} other in catalogue)</span>
                  )}
                </span>
              )}
            </p>
            {hasActiveFilters && matchingProducts.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent-lime text-brand-deep">
                Matching Filters
              </span>
            )}
          </div>

          <Link
            href="/compare"
            className="text-xs font-bold text-brand-evergreen hover:text-brand-deep underline focus-ring px-1.5 py-0.5 rounded self-start sm:self-auto"
          >
            Open Comparison Tool &rarr;
          </Link>
        </div>

        {/* Product Cards Grid / Skeleton / Empty State */}
        {loading ? (
          /* Skeleton Loading Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-5 rounded-card bg-surface border border-border shadow-sm space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="w-16 h-5 bg-border/60 rounded-full" />
                  <div className="w-20 h-5 bg-border/40 rounded-full" />
                </div>
                <div className="w-14 h-14 rounded-card bg-surface-sage/50" />
                <div className="space-y-2">
                  <div className="w-3/4 h-5 bg-border/70 rounded" />
                  <div className="w-1/2 h-4 bg-border/40 rounded" />
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="w-full h-3 bg-border/40 rounded" />
                  <div className="w-5/6 h-3 bg-border/40 rounded" />
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <div className="w-24 h-4 bg-border/50 rounded" />
                  <div className="w-16 h-4 bg-border/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : matchingProducts.length === 0 ? (
          /* Empty Matching State */
          <div className="py-10 px-6 rounded-card bg-surface border border-border text-center shadow-xs">
            <EmptyState
              title="No products match your active filters"
              description="Try clearing search keywords, choosing broader category filters, or selecting 'All Goals'. You can also explore the rest of the catalogue below."
            />
            <div className="mt-5 flex justify-center">
              <Button onClick={clearAllFilters} variant="primary" size="default">
                Clear all filters
              </Button>
            </div>
          </div>
        ) : (
          /* Primary Product Cards Grid */
          <section aria-label="Matching Products">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingProducts.map((product) => (
                <ProductCardItem
                  key={product.id}
                  product={product}
                  isCompared={selectedForCompare.includes(product.id)}
                  onToggleCompare={toggleCompare}
                  isNonMatching={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Products Not Matching Active Filters (Shown with a clear separation) */}
        {hasActiveFilters && nonMatchingProducts.length > 0 && (
          <section aria-label="Other Products outside active filters" className="mt-12 md:mt-16">
            {/* Visual separation divider */}
            <div className="relative mb-8 md:mb-10" role="separator" aria-label="Catalogue separation divider">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t-2 border-dashed border-border" />
              </div>
              <div className="relative flex justify-center">
                <div className="bg-paper px-4 py-1.5 rounded-full border border-border shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-evergreen" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-deep">
                    Other Catalogue Products
                  </span>
                  <span className="text-[11px] font-semibold text-muted">
                    ({nonMatchingProducts.length})
                  </span>
                </div>
              </div>
            </div>

            {/* Informative separation banner */}
            <div className="mb-6 p-4 md:p-5 rounded-card bg-surface-sage/35 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-bold text-base md:text-lg text-brand-deep">
                    Products Not Matching Current Filters
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface text-muted border border-border">
                    {nonMatchingProducts.length} available
                  </span>
                </div>
                <p className="text-xs text-charcoal/75 mt-1 leading-relaxed">
                  These items do not pass your active filter criteria, but remain available here for quick comparison and discovery.
                </p>
              </div>

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-brand-evergreen hover:text-brand-deep underline focus-ring px-2 py-1 shrink-0 self-start sm:self-auto"
              >
                Reset filters to show all
              </button>
            </div>

            {/* Grid of Non-Matching Products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nonMatchingProducts.map((product) => (
                <ProductCardItem
                  key={product.id}
                  product={product}
                  isCompared={selectedForCompare.includes(product.id)}
                  onToggleCompare={toggleCompare}
                  isNonMatching={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Filters Dialog Primitive */}
        <FilterDialog
          isOpen={isFilterDialogOpen}
          onClose={() => setIsFilterDialogOpen(false)}
          appliedFilters={filterCriteria}
          onApply={handleApplyFilters}
          products={products}
          triggerRef={filtersButtonRef}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted">
        <div className="max-w-container mx-auto px-5 space-y-2">
          <p className="font-semibold text-brand-deep">
            Bodywise Match &bull; Transparent Product Discovery Prototype
          </p>
          <p>
            Informational product finder only. No clinical evaluations, therapeutic claims, or promised outcomes.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <ProductsPageContent />
    </React.Suspense>
  );
}
