"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  PaperPlaneRight,
  Sparkle,
  ChatCircleDots,
  Trash,
  ArrowRight,
  ArrowsLeftRight,
  Check,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import { useChat } from "@/hooks/useChat";
import { SourceTag } from "@/components/ui";

export function ChatPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isChatOpen,
    setIsChatOpen,
    messages,
    isLoading,
    error,
    pageContext,
    contextLabel,
    dismissContext,
    sendMessage,
    proposedPatch,
    applyProposedPatch,
    candidateCount,
    lastCandidates,
    clearChat,
  } = useChat();

  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);

  // Esc key and focus trap
  React.useEffect(() => {
    if (!isChatOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsChatOpen(false);
        triggerButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isChatOpen, setIsChatOpen]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen, isLoading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine launcher elevation to avoid sticky bottom bar on confirm, results & product detail
  const isElevated =
    pathname === "/match/confirm" ||
    pathname === "/match/results" ||
    pathname.startsWith("/products/");

  return (
    <>
      {/* Floating launcher button on mobile and desktop */}
      <div
        className={`fixed z-50 transition-all duration-200 right-4 sm:right-6 ${
          isElevated ? "bottom-24 sm:bottom-6" : "bottom-6"
        }`}
      >
        <button
          ref={triggerButtonRef}
          type="button"
          data-testid="chat-launcher"
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label={isChatOpen ? "Close Bodywise Assistant" : "Open Bodywise Assistant"}
          aria-expanded={isChatOpen}
          aria-haspopup="dialog"
          className="flex items-center gap-2.5 px-4 py-3 min-h-[44px] min-w-[44px] bg-brand-deep text-white font-medium text-sm rounded-full shadow-lg hover:bg-brand-evergreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-evergreen active:scale-95 transition-all"
        >
          <Sparkle weight="regular" className="w-5 h-5 text-accent-lime" />
          <span className="hidden sm:inline">Ask Assistant</span>
          {candidateCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold bg-white/20 rounded-full">
              {candidateCount}
            </span>
          )}
        </button>
      </div>

      {/* Backdrop */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsChatOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over / Modal Panel */}
      {isChatOpen && (
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-panel-title"
          data-testid="chat-panel"
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-paper shadow-2xl flex flex-col border-l border-border focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-surface-sage/50 flex items-center justify-center text-brand-deep">
                <ChatCircleDots weight="regular" className="w-5 h-5" />
              </div>
              <div>
                <h2 id="chat-panel-title" className="font-display font-semibold text-base text-brand-deep leading-tight">
                  Bodywise Assistant
                </h2>
                <p className="text-xs text-text-muted">Verified packaging facts & guidance</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear chat history"
                  aria-label="Clear chat"
                  className="p-2 text-text-muted hover:text-charcoal rounded-button min-h-[40px] min-w-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-evergreen"
                >
                  <Trash weight="regular" className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                aria-label="Close Assistant panel"
                className="p-2 text-text-muted hover:text-charcoal rounded-button min-h-[40px] min-w-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-evergreen"
              >
                <X weight="regular" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Context Banner */}
          {contextLabel && (
            <div className="bg-surface-sage/30 px-4 py-2 border-b border-border flex items-center justify-between text-xs text-brand-deep">
              <span className="font-medium truncate mr-2">{contextLabel}</span>
              <button
                type="button"
                onClick={dismissContext}
                className="text-text-muted hover:text-brand-deep flex items-center gap-1 text-[11px] underline focus:outline-none"
              >
                Clear context
              </button>
            </div>
          )}

          {/* Live Shortlist Status Bar */}
          {candidateCount > 0 && (
            <div className="bg-surface px-4 py-2 border-b border-border flex items-center justify-between text-xs">
              <span className="text-charcoal font-medium">
                Shortlist: <strong className="text-brand-deep">{candidateCount}</strong> product{candidateCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsChatOpen(false);
                  router.push("/match/results");
                }}
                className="inline-flex items-center gap-1 font-semibold text-brand-evergreen hover:text-brand-deep text-xs focus:outline-none focus:underline"
              >
                <span>View matches</span>
                <ArrowRight weight="bold" className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Proposed Patch Bar (Apply to Match) */}
          {proposedPatch && (
            <div className="bg-accent-lime/20 px-4 py-2.5 border-b border-border flex items-center justify-between gap-2 text-xs">
              <span className="text-brand-deep font-medium">Updated criteria ready to apply</span>
              <button
                type="button"
                onClick={applyProposedPatch}
                className="inline-flex items-center gap-1 px-3 py-1 bg-brand-deep text-white text-xs font-semibold rounded-button hover:bg-brand-evergreen focus:outline-none focus:ring-2 focus:ring-brand-evergreen"
              >
                <Check weight="bold" className="w-3 h-3 text-accent-lime" />
                <span>Apply to match</span>
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.length === 0 && (
              <div className="py-8 text-center px-4">
                <div className="w-10 h-10 rounded-full bg-surface-sage/40 mx-auto mb-3 flex items-center justify-center text-brand-deep">
                  <Sparkle weight="regular" className="w-5 h-5 text-brand-evergreen" />
                </div>
                <h3 className="font-display font-semibold text-charcoal text-sm mb-1">
                  How can we help your routine today?
                </h3>
                <p className="text-xs text-text-muted max-w-xs mx-auto mb-4 leading-relaxed">
                  Ask about verified ingredients, usage directions, or describe your personal care goal.
                </p>

                {/* Quick Starters */}
                <div className="flex flex-col gap-2 max-w-xs mx-auto text-left">
                  {pageContext.page === "help" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => sendMessage("Where is my order?")}
                        className="p-2.5 bg-white border border-border rounded-button text-xs text-charcoal hover:bg-surface transition-colors focus:outline-none focus:ring-1 focus:ring-brand-evergreen text-left"
                      >
                        Where is my order?
                      </button>
                      <button
                        type="button"
                        onClick={() => sendMessage("Contact official support")}
                        className="p-2.5 bg-white border border-border rounded-button text-xs text-charcoal hover:bg-surface transition-colors focus:outline-none focus:ring-1 focus:ring-brand-evergreen text-left"
                      >
                        Contact official customer care
                      </button>
                    </>
                  ) : pageContext.page === "product_detail" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => sendMessage("What are the key ingredients?")}
                        className="p-2.5 bg-white border border-border rounded-button text-xs text-charcoal hover:bg-surface transition-colors focus:outline-none focus:ring-1 focus:ring-brand-evergreen text-left"
                      >
                        What are the key ingredients?
                      </button>
                      <button
                        type="button"
                        onClick={() => sendMessage("How do I use this in my routine?")}
                        className="p-2.5 bg-white border border-border rounded-button text-xs text-charcoal hover:bg-surface transition-colors focus:outline-none focus:ring-1 focus:ring-brand-evergreen text-left"
                      >
                        How do I use this in my routine?
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => sendMessage("Salicylic acid body wash for morning routine")}
                        className="p-2.5 bg-white border border-border rounded-button text-xs text-charcoal hover:bg-surface transition-colors focus:outline-none focus:ring-1 focus:ring-brand-evergreen text-left"
                      >
                        Salicylic acid body wash for morning routine
                      </button>
                      <button
                        type="button"
                        onClick={() => sendMessage("Fragrance free moisturizer for dry skin")}
                        className="p-2.5 bg-white border border-border rounded-button text-xs text-charcoal hover:bg-surface transition-colors focus:outline-none focus:ring-1 focus:ring-brand-evergreen text-left"
                      >
                        Fragrance-free moisturizer for dry skin
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? "bg-brand-evergreen text-white rounded-2xl rounded-tr-sm"
                        : "bg-surface-sage border border-border text-charcoal rounded-2xl rounded-tl-sm shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Source tag on assistant replies */}
                    {!isUser && msg.sourceTag && (
                      <div className="mt-2.5 pt-2 border-t border-border/60">
                        <SourceTag
                          source={msg.sourceTag.source}
                          lastVerifiedAt={msg.sourceTag.verifiedAt}
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick reply chips under assistant message */}
                  {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr.id}
                          type="button"
                          onClick={() => sendMessage(qr.label)}
                          className="px-3 py-1.5 bg-surface text-brand-deep border border-border text-xs rounded-full hover:bg-surface-sage/40 hover:border-brand-evergreen/40 focus:outline-none focus:ring-1 focus:ring-brand-evergreen transition-colors"
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Candidates card preview inside chat if relevant */}
            {lastCandidates.length > 0 && !isLoading && (
              <div className="mt-3 space-y-2">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Relevant Options
                </span>
                <div className="space-y-2">
                  {lastCandidates.slice(0, 2).map((cand) => (
                    <div
                      key={cand.familyId}
                      className="p-3 bg-white border border-border rounded-card flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {(cand.imageUrl || cand.image_url) && (
                          <div className="w-9 h-9 rounded-md bg-surface-sage/30 border border-border/60 shrink-0 overflow-hidden">
                            <img
                              src={cand.imageUrl || cand.image_url || ""}
                              alt={cand.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-brand-deep truncate">
                            {cand.name}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            {cand.format} {cand.priceInr ? `· ₹${cand.priceInr}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`https://bebodywise.com/product/${cand.familyId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-xs font-semibold bg-brand-primary text-white rounded-button hover:bg-brand-deep flex items-center gap-1"
                        >
                          <span>Buy</span>
                          <ArrowSquareOut className="w-3 h-3" weight="bold" />
                        </a>
                        <Link
                          href={`/products/${cand.familyId}`}
                          onClick={() => setIsChatOpen(false)}
                          className="px-2.5 py-1 text-xs font-medium text-brand-evergreen border border-border rounded-button hover:bg-surface"
                        >
                          View
                        </Link>
                        <Link
                          href={`/compare?items=${cand.familyId}`}
                          onClick={() => setIsChatOpen(false)}
                          title="Add to compare"
                          className="p-1 text-text-muted hover:text-charcoal rounded-button"
                        >
                          <ArrowsLeftRight weight="regular" className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-text-muted py-2 px-1">
                <div className="w-2 h-2 rounded-full bg-brand-evergreen animate-pulse" />
                <span>Searching verified catalogue...</span>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-caution-peach/40 border border-caution-peach text-caution-text rounded-button text-xs">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white border-t border-border">
            <div className="flex items-end gap-2 bg-paper border border-border rounded-card p-2 focus-within:ring-2 focus-within:ring-brand-evergreen focus-within:border-transparent transition-all">
              <textarea
                ref={textareaRef}
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about products, ingredients, or routine..."
                rows={1}
                className="w-full bg-transparent resize-none border-0 text-sm text-charcoal placeholder:text-text-muted focus:outline-none focus:ring-0 max-h-28 py-1 px-1"
              />
              <button
                type="button"
                data-testid="chat-send"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="p-2 min-h-[36px] min-w-[36px] rounded-button bg-brand-evergreen text-white hover:bg-brand-deep disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-evergreen transition-all shrink-0 flex items-center justify-center"
              >
                <PaperPlaneRight weight="fill" className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-text-muted text-center mt-2">
              Zero medical claims. Verified packaging facts only.
            </p>
          </div>
        </aside>
      )}
    </>
  );
}
