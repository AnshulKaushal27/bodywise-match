"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Sparkle,
  Drop,
  Flask,
  Wind,
  Sun,
  Pill,
  ShieldCheck,
  Question,
  X,
  ArrowsLeftRight,
  Plus,
  SlidersHorizontal,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import {
  ProductRecord,
  DEMO_CATALOGUE_SEED,
  CONTROLLED_GOALS,
} from "@bodywise/shared";
import { Button } from "@/components/ui";

function CompareView() {
  const searchParams = useSearchParams();

  // Load selected product IDs from search params, session storage, or default to first 3 products
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() => {
    return [
      DEMO_CATALOGUE_SEED[0].id,
      DEMO_CATALOGUE_SEED[1].id,
      DEMO_CATALOGUE_SEED[2].id,
    ];
  });

  const [showOnlyDifferences, setShowOnlyDifferences] = React.useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState<boolean>(false);

  // Sync with searchParams or sessionStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const paramIds = searchParams.get("ids");
      if (paramIds) {
        const ids = paramIds.split(",").filter((id) =>
          DEMO_CATALOGUE_SEED.some((p) => p.id === id)
        );
        if (ids.length > 0) {
          setSelectedIds(ids.slice(0, 3));
          return;
        }
      }

      // Check sessionStorage
      try {
        const raw = sessionStorage.getItem("bodywise_compare_ids");
        if (raw) {
          const stored: string[] = JSON.parse(raw);
          const valid = stored.filter((id) =>
            DEMO_CATALOGUE_SEED.some((p) => p.id === id)
          );
          if (valid.length > 0) {
            setSelectedIds(valid.slice(0, 3));
            return;
          }
        }
      } catch {
        // Fallback to default
      }
    }
  }, [searchParams]);

  // Save to sessionStorage when selectedIds change
  const updateSelectedIds = (newIds: string[]) => {
    setSelectedIds(newIds);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bodywise_compare_ids", JSON.stringify(newIds));
    }
  };

  const removeProduct = (id: string) => {
    if (selectedIds.length <= 1) return; // Keep at least 1
    const updated = selectedIds.filter((pId) => pId !== id);
    updateSelectedIds(updated);
  };

  const addProduct = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= 3) return;
    const updated = [...selectedIds, id];
    updateSelectedIds(updated);
    setIsAddModalOpen(false);
  };

  const swapProduct = (oldId: string, newId: string) => {
    const updated = selectedIds.map((id) => (id === oldId ? newId : id));
    updateSelectedIds(updated);
  };

  // Resolve product objects
  const selectedProducts: ProductRecord[] = selectedIds
    .map((id) => DEMO_CATALOGUE_SEED.find((p) => p.id === id))
    .filter((p): p is ProductRecord => Boolean(p));

  // Available products to add (not currently in selectedProducts)
  const availableToAdd = DEMO_CATALOGUE_SEED.filter(
    (p) => !selectedIds.includes(p.id)
  );

  // Helper for Category Icon
  const getProductTypeIcon = (category: string) => {
    switch (category) {
      case "body_wash":
      case "face_wash":
        return <Drop className="w-6 h-6 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "serum":
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
  };

  // Helper to determine difference across selected products
  const checkDifference = (getter: (p: ProductRecord) => string | number | boolean | null): boolean => {
    if (selectedProducts.length <= 1) return false;
    const firstVal = getter(selectedProducts[0]);
    return selectedProducts.some((p) => getter(p) !== firstVal);
  };

  // Row differences
  const diffs = {
    format: checkDifference((p) => p.format),
    size: checkDifference((p) => p.size),
    goals: checkDifference((p) => [...p.supported_goals].sort().join(",")),
    ingredients: checkDifference((p) => (p.ingredients ? [...p.ingredients].sort().join(",") : "null")),
    fragrance: checkDifference((p) => p.fragrance_free),
    price: checkDifference((p) => p.price_inr),
    provenance: checkDifference((p) => `${p.source_url}_${p.last_verified_at}`),
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Main Container */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1 w-full">
        {/* Title & Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/products"
                className="text-xs font-semibold text-brand-evergreen hover:text-brand-deep inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Catalogue</span>
              </Link>
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-brand-evergreen">
              Side-by-Side Comparison
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight mt-1">
              Compare Product Specifications
            </h1>
            <p className="text-xs md:text-sm text-charcoal/80 mt-1 max-w-xl">
              Compare up to 3 Be Bodywise products side by side with objective format details, verified ingredients, cautions, and provenance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" weight="regular" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print</span>
            </Button>
          </div>
        </div>

          {/* Controls: "Show only differences" & "Add product" */}
          <div className="flex flex-wrap items-center gap-3 no-print">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-deep cursor-pointer bg-surface px-3 py-2 rounded-full border border-border select-none hover:bg-surface-sage/30 transition-colors">
              <input
                type="checkbox"
                checked={showOnlyDifferences}
                onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                className="w-4 h-4 rounded text-brand-evergreen focus:ring-brand-evergreen border-border cursor-pointer"
              />
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" />
              <span>Show only differences</span>
            </label>

            {selectedProducts.length < 3 && availableToAdd.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" weight="bold" />
                <span>Add Product ({selectedProducts.length}/3)</span>
              </Button>
            )}
          </div>

        {/* Mobile Horizontal Scroll Hint */}
        <div className="flex sm:hidden items-center justify-between text-xs text-muted mb-3 px-1 no-print">
          <span className="flex items-center gap-1.5 font-medium">
            <ArrowsLeftRight className="w-4 h-4 text-brand-evergreen" weight="regular" />
            Swipe horizontally to compare columns
          </span>
          <span className="text-[10px] bg-surface-sage px-2 py-0.5 rounded-full font-bold text-brand-deep">
            Sticky labels locked &rarr;
          </span>
        </div>

        {/* Print Title Heading (only visible in print) */}
        <div className="hidden print-only mb-4">
          <h1 className="text-xl font-bold text-brand-deep">
            Bodywise Match &bull; Product Comparison Report
          </h1>
          <p className="text-xs text-muted">
            Independent transparent specifications comparison &bull; Verified provenance
          </p>
        </div>

        {/* ================= COMPARISON TABLE CONTAINER ================= */}
        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
          <table className="w-full text-left border-collapse min-w-[620px] sm:min-w-[700px]">
            <thead>
              {/* Product Header Row */}
              <tr className="border-b-2 border-border bg-surface">
                {/* Sticky First Column on Mobile */}
                <th
                  scope="col"
                  className="sticky left-0 bg-surface z-20 p-4 w-36 sm:w-44 border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.04)] align-top"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">
                    Attributes
                  </span>
                  <span className="text-xs font-semibold text-brand-deep">
                    {selectedProducts.length} Selected
                  </span>
                </th>

                {/* Product Column Headers */}
                {selectedProducts.map((prod) => (
                  <th
                    key={prod.id}
                    scope="col"
                    className="p-4 sm:p-5 align-top min-w-[200px] sm:min-w-[240px] border-r border-border last:border-r-0"
                  >
                    <div className="flex items-center justify-end gap-2 mb-2 no-print">
                      {selectedProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(prod.id)}
                          aria-label={`Remove ${prod.official_name} from comparison`}
                          className="text-muted hover:text-error-text p-1 rounded focus-ring"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" weight="bold" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-card bg-surface-sage/40 border border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.official_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          getProductTypeIcon(prod.category)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-sm sm:text-base text-brand-deep leading-tight">
                          <Link
                            href={`/products/${prod.slug}`}
                            className="hover:text-brand-evergreen focus-ring rounded"
                          >
                            {prod.official_name}
                          </Link>
                        </h3>
                        <span className="text-[11px] text-muted capitalize block mt-0.5">
                          {prod.category.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Buy Link & Price */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <a
                        href={prod.source_url || `https://bebodywise.com/product/${prod.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-primary text-white hover:bg-brand-deep transition-colors focus-ring"
                      >
                        <span>Buy</span>
                        <ArrowSquareOut className="w-3 h-3" weight="bold" />
                      </a>
                      {prod.price_inr && (
                        <span className="text-xs font-bold text-brand-deep">₹{prod.price_inr}</span>
                      )}
                    </div>

                    {/* Quick Switch Dropdown */}
                    <div className="no-print mt-2">
                      <select
                        value={prod.id}
                        onChange={(e) => swapProduct(prod.id, e.target.value)}
                        className="w-full text-xs py-1.5 px-2 bg-paper border border-border rounded-button text-charcoal focus-ring"
                        aria-label={`Change product from ${prod.official_name}`}
                      >
                        {DEMO_CATALOGUE_SEED.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.official_name} ({candidate.format})
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                ))}

                {/* Empty Slot if < 3 Products */}
                {selectedProducts.length < 3 && (
                  <th
                    scope="col"
                    className="p-4 align-middle text-center bg-paper/50 border-dashed border-border min-w-[180px] no-print"
                  >
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-full h-full min-h-[140px] border-2 border-dashed border-border hover:border-brand-evergreen rounded-card flex flex-col items-center justify-center p-4 text-center group focus-ring transition-colors active:scale-[0.98] motion-safe:transition-transform"
                    >
                      <div className="w-8 h-8 rounded-full bg-surface-sage/50 text-brand-evergreen flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus className="w-4 h-4" weight="bold" />
                      </div>
                      <span className="text-xs font-bold text-brand-deep group-hover:text-brand-evergreen">
                        + Add product
                      </span>
                      <span className="text-[11px] text-muted mt-0.5">
                        Compare up to 3
                      </span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-border text-xs sm:text-sm text-charcoal">
              {/* ROW 1: FORMAT */}
              {(!showOnlyDifferences || diffs.format) && (
                <tr className={diffs.format ? "bg-surface-sage/10" : ""}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-surface z-10 p-3.5 sm:p-4 font-bold text-brand-deep border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Format</span>
                      {diffs.format && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-lime text-brand-deep">
                          Diff
                        </span>
                      )}
                    </div>
                  </th>
                  {selectedProducts.map((p) => (
                    <td key={p.id} className="p-3.5 sm:p-4 border-r border-border last:border-r-0 font-medium">
                      {p.format || (
                        <span className="italic text-muted font-normal">Not verified yet</span>
                      )}
                    </td>
                  ))}
                  {selectedProducts.length < 3 && <td className="bg-paper/30 no-print" />}
                </tr>
              )}

              {/* ROW 2: SIZE */}
              {(!showOnlyDifferences || diffs.size) && (
                <tr className={diffs.size ? "bg-surface-sage/10" : ""}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-surface z-10 p-3.5 sm:p-4 font-bold text-brand-deep border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Size</span>
                      {diffs.size && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-lime text-brand-deep">
                          Diff
                        </span>
                      )}
                    </div>
                  </th>
                  {selectedProducts.map((p) => (
                    <td key={p.id} className="p-3.5 sm:p-4 border-r border-border last:border-r-0">
                      {p.size || (
                        <span className="italic text-muted">Not verified yet</span>
                      )}
                    </td>
                  ))}
                  {selectedProducts.length < 3 && <td className="bg-paper/30 no-print" />}
                </tr>
              )}

              {/* ROW 3: GOALS */}
              {(!showOnlyDifferences || diffs.goals) && (
                <tr className={diffs.goals ? "bg-surface-sage/10" : ""}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-surface z-10 p-3.5 sm:p-4 font-bold text-brand-deep border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.04)] align-top"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Supported Goals</span>
                      {diffs.goals && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-lime text-brand-deep">
                          Diff
                        </span>
                      )}
                    </div>
                  </th>
                  {selectedProducts.map((p) => (
                    <td key={p.id} className="p-3.5 sm:p-4 border-r border-border last:border-r-0 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {p.supported_goals.map((gId) => {
                          const goalDef = CONTROLLED_GOALS.find((g) => g.id === gId);
                          return (
                            <span
                              key={gId}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-paper text-charcoal border border-border"
                            >
                              {goalDef?.label || gId.replace(/_/g, " ")}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                  {selectedProducts.length < 3 && <td className="bg-paper/30 no-print" />}
                </tr>
              )}

              {/* ROW 4: INGREDIENTS (Missing data shows "Not verified yet", never hidden) */}
              {(!showOnlyDifferences || diffs.ingredients) && (
                <tr className={diffs.ingredients ? "bg-surface-sage/10" : ""}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-surface z-10 p-3.5 sm:p-4 font-bold text-brand-deep border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.04)] align-top"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Ingredients</span>
                      {diffs.ingredients && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-lime text-brand-deep">
                          Diff
                        </span>
                      )}
                    </div>
                  </th>
                  {selectedProducts.map((p) => (
                    <td key={p.id} className="p-3.5 sm:p-4 border-r border-border last:border-r-0 align-top">
                      {p.ingredients && p.ingredients.length > 0 ? (
                        <div className="text-xs space-y-1">
                          <p className="line-clamp-3">{p.ingredients.join(", ")}</p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs italic text-muted bg-surface-sage/40 px-2 py-1 rounded">
                          <Question className="w-3.5 h-3.5" weight="regular" />
                          <span>Not verified yet</span>
                        </span>
                      )}
                    </td>
                  ))}
                  {selectedProducts.length < 3 && <td className="bg-paper/30 no-print" />}
                </tr>
              )}

              {/* ROW 5: FRAGRANCE-FREE */}
              {(!showOnlyDifferences || diffs.fragrance) && (
                <tr className={diffs.fragrance ? "bg-surface-sage/10" : ""}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-surface z-10 p-3.5 sm:p-4 font-bold text-brand-deep border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Fragrance-Free</span>
                      {diffs.fragrance && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-lime text-brand-deep">
                          Diff
                        </span>
                      )}
                    </div>
                  </th>
                  {selectedProducts.map((p) => (
                    <td key={p.id} className="p-3.5 sm:p-4 border-r border-border last:border-r-0">
                      {p.fragrance_free === true ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-evergreen">
                          <ShieldCheck className="w-4 h-4" weight="regular" />
                          <span>Yes, fragrance-free</span>
                        </span>
                      ) : p.fragrance_free === false ? (
                        <span className="text-charcoal font-medium">Contains fragrance</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs italic text-muted bg-surface-sage/40 px-2 py-1 rounded">
                          <Question className="w-3.5 h-3.5" weight="regular" />
                          <span>Not verified yet</span>
                        </span>
                      )}
                    </td>
                  ))}
                  {selectedProducts.length < 3 && <td className="bg-paper/30 no-print" />}
                </tr>
              )}

              {/* ROW 6: PRICE */}
              {(!showOnlyDifferences || diffs.price) && (
                <tr className={diffs.price ? "bg-surface-sage/10" : ""}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-surface z-10 p-3.5 sm:p-4 font-bold text-brand-deep border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Price (INR)</span>
                      {diffs.price && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-lime text-brand-deep">
                          Diff
                        </span>
                      )}
                    </div>
                  </th>
                  {selectedProducts.map((p) => (
                    <td key={p.id} className="p-3.5 sm:p-4 border-r border-border last:border-r-0 font-bold text-brand-deep">
                      {p.price_inr !== null ? (
                        <span>₹{p.price_inr}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-normal italic text-muted bg-surface-sage/40 px-2 py-1 rounded">
                          <Question className="w-3.5 h-3.5" weight="regular" />
                          <span>Not verified yet</span>
                        </span>
                      )}
                    </td>
                  ))}
                  {selectedProducts.length < 3 && <td className="bg-paper/30 no-print" />}
                </tr>
              )}

              {/* ROW 7: SOURCE / VERIFICATION DATE */}
              {(!showOnlyDifferences || diffs.provenance) && (
                <tr className={diffs.provenance ? "bg-surface-sage/10" : ""}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-surface z-10 p-3.5 sm:p-4 font-bold text-brand-deep border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.04)] align-top"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Source / Date</span>
                      {diffs.provenance && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-lime text-brand-deep">
                          Diff
                        </span>
                      )}
                    </div>
                  </th>
                  {selectedProducts.map((p) => (
                    <td key={p.id} className="p-3.5 sm:p-4 border-r border-border last:border-r-0 align-top text-xs">
                      {p.source_url && p.last_verified_at ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold block truncate max-w-[180px]">{p.source_url}</span>
                          <span className="text-muted block">Checked {p.last_verified_at}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 italic text-muted bg-surface-sage/40 px-2 py-1 rounded">
                          <Question className="w-3.5 h-3.5" weight="regular" />
                          <span>Not verified yet</span>
                        </span>
                      )}
                    </td>
                  ))}
                  {selectedProducts.length < 3 && <td className="bg-paper/30 no-print" />}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Link back to Match or Products */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-card bg-surface-sage/30 border border-border no-print">
          <div>
            <h3 className="font-display font-bold text-base text-brand-deep">
              Want personalized recommendations instead of manual comparison?
            </h3>
            <p className="text-xs text-charcoal/80 mt-0.5">
              Tell us your primary skin or hair concern and let our transparent rules shortlist the best fit for your routine.
            </p>
          </div>
          <Link
            href="/match"
            className="shrink-0 text-xs font-bold bg-brand-evergreen text-surface hover:bg-brand-deep px-4 py-2.5 rounded-button focus-ring shadow-sm transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            Find My Match &rarr;
          </Link>
        </div>

        {/* ================= MODAL: ADD PRODUCT TO COMPARISON ================= */}
        {isAddModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in no-print"
          >
            <div className="bg-surface border border-border rounded-card shadow-card max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 id="modal-add-title" className="font-display font-bold text-base text-brand-deep">
                  Add Product to Comparison ({selectedProducts.length}/3)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-muted hover:text-charcoal p-1 rounded focus-ring"
                >
                  <X className="w-5 h-5" weight="bold" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {availableToAdd.length === 0 ? (
                  <p className="text-xs text-muted text-center py-6">
                    All catalogue products are already in your comparison table.
                  </p>
                ) : (
                  availableToAdd.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-3.5 rounded-button bg-paper hover:bg-surface-sage/30 border border-border flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-card bg-surface-sage/50 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {cand.image_url ? (
                            <img
                              src={cand.image_url}
                              alt={cand.official_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            getProductTypeIcon(cand.category)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-xs sm:text-sm text-brand-deep truncate">
                            {cand.official_name}
                          </h4>
                          <p className="text-[11px] text-muted truncate">
                            {cand.format} &bull; {cand.size}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => addProduct(cand.id)}
                        className="text-xs shrink-0"
                      >
                        Select
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted no-print">
        <div className="max-w-container mx-auto px-5 space-y-2">
          <p className="font-semibold text-brand-deep">
            Bodywise Match &bull; Transparent Wellness Discovery
          </p>
          <p>
            Informational product comparison only &bull; Facts sourced from official packaging &bull; Independent discovery prototype
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-evergreen border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold text-brand-deep">Loading comparison specifications...</p>
          </div>
        </div>
      }
    >
      <CompareView />
    </React.Suspense>
  );
}
