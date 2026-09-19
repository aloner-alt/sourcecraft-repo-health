"use client";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Filter } from "lucide-react";

export function LanguageFilter({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <SelectFilter value={value} options={options.map(option => ({ value: option, label: option }))} onChange={onChange} ariaLabel="Язык репозитория" />;
}

export function SelectFilter({ value, options, onChange, ariaLabel, className = "" }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; ariaLabel: string; className?: string }) {
  return <Select.Root value={value} onValueChange={next => { if (next !== null) onChange(next); }}>
    <Select.Trigger className={`language-filter-trigger ${className}`} aria-label={ariaLabel}><Filter size={16} aria-hidden="true" /><Select.Value>{options.find(option => option.value === value)?.label}</Select.Value><Select.Icon className="language-filter-chevron"><ChevronDown size={16} /></Select.Icon></Select.Trigger>
    <Select.Portal><Select.Positioner sideOffset={8} align="end" alignItemWithTrigger={false} className="language-filter-positioner"><Select.Popup className="language-filter-popup"><Select.List>{options.map(option => <Select.Item value={option.value} key={option.value} className="language-filter-option"><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Check size={16} aria-hidden="true" /></Select.ItemIndicator></Select.Item>)}</Select.List></Select.Popup></Select.Positioner></Select.Portal>
  </Select.Root>;
}
