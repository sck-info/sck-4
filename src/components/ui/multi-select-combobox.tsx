"use client";

import type React from "react";

import { useState, useRef, useEffect, useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MultiSelectComboboxProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  width?: string;
  compactCountOnMulti?: boolean;
  defaultValues?: string[];
  lockedValues?: string[];
  formatOptionLabel?: (value: string) => string;
  badgeStyle?: "default" | "soft";
}

const unique = (values: string[]) => Array.from(new Set(values));

export function MultiSelectCombobox({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select items",
  width = "w-full sm:w-44",
  compactCountOnMulti = false,
  defaultValues = [],
  lockedValues = [],
  formatOptionLabel = (value) => value,
  badgeStyle = "soft",
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSelectedList, setShowSelectedList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleChips, setVisibleChips] = useState<string[]>([]);
  const [showCountBadge, setShowCountBadge] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chipsContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedDefaultValues = useMemo(
    () =>
      unique([...defaultValues, ...lockedValues]).filter((value) =>
        options.includes(value),
      ),
    [defaultValues, lockedValues, options],
  );

  const normalizedSelectedValues = useMemo(
    () =>
      unique([...normalizedDefaultValues, ...selectedValues]).filter((value) =>
        options.includes(value),
      ),
    [normalizedDefaultValues, selectedValues, options],
  );

  const filteredOptions = options.filter(
    (option) =>
      typeof option === "string" &&
      !normalizedSelectedValues.includes(option) &&
      option.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowSelectedList(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      try {
        inputRef.current.select();
      } catch {}
    }
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        inputRef.current.blur();
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  useEffect(() => {
    if (!chipsContainerRef.current) return;

    const containerWidth = chipsContainerRef.current.offsetWidth;
    let accumulatedWidth = 0;
    const chipWidthEstimate = 80; // Rough estimate for each chip + gap
    const countBadgeWidth = 72; // Keep enough space for larger +NNN counts

    let visibleCount = 0;
    for (let i = 0; i < normalizedSelectedValues.length; i++) {
      accumulatedWidth += chipWidthEstimate;
      if (accumulatedWidth + countBadgeWidth > containerWidth) {
        break;
      }
      visibleCount++;
    }

    // Always show at least 1 chip if items are selected
    if (normalizedSelectedValues.length > 0 && visibleCount === 0) {
      visibleCount = 1;
    }

    const nextVisibleChips = normalizedSelectedValues.slice(0, visibleCount);
    const nextShowCountBadge = normalizedSelectedValues.length > visibleCount;

    setVisibleChips((current) => {
      if (
        current.length === nextVisibleChips.length &&
        current.every((value, index) => value === nextVisibleChips[index])
      ) {
        return current;
      }

      return nextVisibleChips;
    });
    setShowCountBadge((current) =>
      current === nextShowCountBadge ? current : nextShowCountBadge,
    );
  }, [normalizedSelectedValues]);

  const handleSelectOption = (option: string) => {
    onSelectionChange(unique([...normalizedSelectedValues, option]));
    setSearchTerm("");
  };

  const handleRemoveChip = (value: string) => {
    if (normalizedDefaultValues.includes(value)) return;
    onSelectionChange(normalizedSelectedValues.filter((v) => v !== value));
  };

  const handleCountBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setShowSelectedList(true);
  };

  const remainingCount = normalizedSelectedValues.length - visibleChips.length;
  const chipClassName =
    badgeStyle === "soft"
      ? "flex items-center gap-1 border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shadow-xs ring-1 ring-blue-100/70"
      : "flex items-center gap-1 bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap";
  const lockedChipClassName =
    badgeStyle === "soft"
      ? "flex items-center gap-1 border border-slate-200 bg-slate-50 text-slate-700 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shadow-xs ring-1 ring-slate-100/70"
      : chipClassName;
  const chipRemoveClassName =
    badgeStyle === "soft"
      ? "hover:bg-blue-100 rounded-full p-0 inline-flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
      : "hover:bg-gray-200 rounded-full p-0 inline-flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer";
  const countBadgeClassName =
    "flex items-center gap-1 bg-blue-100 border border-blue-300 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors whitespace-nowrap cursor-pointer";
  const selectedListItemClassName =
    badgeStyle === "soft"
      ? "flex items-center justify-between gap-2 border border-blue-100 bg-blue-50/70 text-slate-700 px-2 py-1.5 rounded text-sm mb-1 last:mb-0"
      : "flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1.5 rounded text-sm mb-1 last:mb-0";

  return (
    <div ref={containerRef} className={`relative ${width}`}>
      <Button
        variant="outline"
        className="w-full justify-between bg-white border border-gray-300 h-auto py-2 px-3 hover:bg-gray-100/50"
        onClick={() => {
          setIsOpen(!isOpen);
          if (showSelectedList) {
            setShowSelectedList(false);
          }
        }}
      >
        <div
          ref={chipsContainerRef}
          className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0"
        >
          {normalizedSelectedValues.length > 0 ? (
            <>
              {visibleChips.map((value) => {
                const isLocked = normalizedDefaultValues.includes(value);

                return (
                  <div
                    key={value}
                    className={isLocked ? lockedChipClassName : chipClassName}
                  >
                    <span className="truncate max-w-[70px]">
                      {formatOptionLabel(value)}
                    </span>
                    {!isLocked && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveChip(value);
                        }}
                        className={chipRemoveClassName}
                        role="button"
                        tabIndex={0}
                        aria-label={`Remove ${value}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRemoveChip(value);
                          }
                        }}
                      >
                        <X className="h-3 w-3 text-current opacity-75" />
                      </div>
                    )}
                  </div>
                );
              })}
              {showCountBadge && remainingCount > 0 && (
                <div
                  onClick={handleCountBadgeClick}
                  className={countBadgeClassName}
                  role="button"
                  tabIndex={0}
                  aria-label={`Show ${remainingCount} more selected items`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCountBadgeClick(e as unknown as React.MouseEvent);
                    }
                  }}
                >
                  +{remainingCount}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-xs">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 ml-2 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {showSelectedList && normalizedSelectedValues.length > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-full">
          <div className="max-h-48 overflow-y-auto p-2">
            {normalizedSelectedValues.map((value) => {
              const isLocked = normalizedDefaultValues.includes(value);

              return (
                <div
                  key={value}
                  className={selectedListItemClassName}
                >
                  <span className="truncate">{formatOptionLabel(value)}</span>
                  {!isLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveChip(value);
                      }}
                      className="hover:bg-gray-300 rounded-full p-0.5 inline-flex items-center justify-center flex-shrink-0 transition-colors"
                      aria-label={`Remove ${value}`}
                    >
                      <X className="h-3 w-3 text-gray-600" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="p-2 border-b border-gray-200">
            <Input
              search
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-300 text-sm"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700 cursor-pointer transition-colors"
                >
                  {formatOptionLabel(option)}
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                No search results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
