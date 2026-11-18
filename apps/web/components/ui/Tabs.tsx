import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
  defaultTabId?: string;
  onTabChange?: (tabId: string) => void;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, tabs, defaultTabId, onTabChange, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState<string>(
      defaultTabId || (tabs[0]?.id ?? "")
    );

    const handleSelect = (id: string) => {
      setActiveTab(id);
      onTabChange?.(id);
    };

    return (
      <div ref={ref} className={cn("w-full flex flex-col gap-4", className)} {...props}>
        <div
          role="tablist"
          className="inline-flex p-1.5 rounded-full bg-surface-sage/50 border border-border w-fit max-w-full overflow-x-auto"
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const tabId = `tab-${tab.id}`;
            const panelId = `panel-${tab.id}`;

            return (
              <button
                key={tab.id}
                role="tab"
                id={tabId}
                aria-selected={isSelected}
                aria-controls={panelId}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleSelect(tab.id)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all duration-150 min-h-[44px] flex items-center justify-center focus-ring whitespace-nowrap",
                  isSelected
                    ? "bg-brand-evergreen text-white shadow-sm font-semibold"
                    : "text-brand-deep hover:text-brand-evergreen hover:bg-surface-sage/60"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          const tabId = `tab-${tab.id}`;
          const panelId = `panel-${tab.id}`;

          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId}
              hidden={!isSelected}
              className={cn("outline-none pt-2 animate-fade-in", !isSelected && "hidden")}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    );
  }
);

Tabs.displayName = "Tabs";
