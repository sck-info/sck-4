"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

export function TimeSelect({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
}: TimeSelectProps) {
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");

  useEffect(() => {
    if (value) {
      const parts = value.split(":");
      if (parts.length >= 2) {
        setSelectedHour(parts[0]);
        setSelectedMinute(parts[1]);
      }
    }
  }, [value]);

  const handleUpdate = (h: string, m: string) => {
    onChange(`${h}:${m}`);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-grow">
        <Select
          disabled={disabled}
          value={selectedHour}
          onValueChange={(h) => {
            setSelectedHour(h);
            handleUpdate(h, selectedMinute);
          }}
        >
          <SelectTrigger className="h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl text-xs w-full flex items-center justify-between text-left whitespace-normal [&>span]:line-clamp-none [&>span]:block [&>span]:w-full text-[#1c1f4a] font-semibold hover:bg-gray-100/50">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {hours.map((h) => {
              const val = String(h).padStart(2, "0");
              const displayHour = h % 12 === 0 ? 12 : h % 12;
              const ampm = h >= 12 ? "PM" : "AM";
              return (
                <SelectItem key={val} value={val} className="text-xs">
                  {displayHour} {ampm}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-grow">
        <Select
          disabled={disabled}
          value={selectedMinute}
          onValueChange={(m) => {
            setSelectedMinute(m);
            handleUpdate(selectedHour, m);
          }}
        >
          <SelectTrigger className="h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl text-xs w-full flex items-center justify-between text-left whitespace-normal [&>span]:line-clamp-none [&>span]:block [&>span]:w-full text-[#1c1f4a] font-semibold hover:bg-gray-100/50">
            <SelectValue placeholder="Minute" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {minutes.map((m) => {
              const val = String(m).padStart(2, "0");
              return (
                <SelectItem key={val} value={val} className="text-xs">
                  {val} Min
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
