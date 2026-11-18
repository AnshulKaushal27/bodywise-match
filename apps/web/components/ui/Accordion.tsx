"use client";

import * as React from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface AccordionItemData {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: AccordionItemData[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, items, defaultOpenId, allowMultiple = false, ...props }, ref) => {
    const [openIds, setOpenIds] = React.useState<string[]>(() =>
      defaultOpenId ? [defaultOpenId] : []
    );

    const toggleItem = (id: string) => {
      setOpenIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((item) => item !== id);
        } else {
          return allowMultiple ? [...prev, id] : [id];
        }
      });
    };

    return (
      <div
        ref={ref}
        className={cn("divide-y divide-border rounded-card border border-border bg-surface overflow-hidden", className)}
        {...props}
      >
        {items.map((item) => {
          const isOpen = openIds.includes(item.id);
          const triggerId = `accordion-trigger-${item.id}`;
          const contentId = `accordion-content-${item.id}`;

          return (
            <div key={item.id} className="transition-colors">
              <h3>
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => toggleItem(item.id)}
                  className="flex w-full items-center justify-between p-5 text-left font-display font-semibold text-brand-deep text-base md:text-lg hover:bg-surface-sage/20 focus-ring min-h-[48px]"
                >
                  <span>{item.title}</span>
                  <CaretDown
                    className={cn(
                      "h-5 w-5 text-brand-evergreen transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <div
                id={contentId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className={cn(
                  "px-5 pb-5 pt-1 text-sm md:text-base text-charcoal leading-relaxed",
                  !isOpen && "hidden"
                )}
              >
                {item.content}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

Accordion.displayName = "Accordion";
