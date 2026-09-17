"use client";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Filter } from "lucide-react";

export function LanguageFilter({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <Select.Root value={value} onValueChange={next => { if (next !== null) onChange(next); }}>
    <Select.Trigger className="language-filter-trigger" aria-label="Язык репозитория"><Filter size={16} aria-hidden="true" /><Select.Value /><Select.Icon className="language-filter-chevron"><ChevronDown size={16} /></Select.Icon></Select.Trigger>
    <Select.Portal><Select.Positioner sideOffset={8} align="end" alignItemWithTrigger={false} className="language-filter-positioner"><Select.Popup className="language-filter-popup"><Select.List>{options.map(option => <Select.Item value={option} key={option} className="language-filter-option"><Select.ItemText>{option}</Select.ItemText><Select.ItemIndicator><Check size={16} aria-hidden="true" /></Select.ItemIndicator></Select.Item>)}</Select.List></Select.Popup></Select.Positioner></Select.Portal>
  </Select.Root>;
}
