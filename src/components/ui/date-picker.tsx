"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  disabledDates?: (date: Date) => boolean
}

const currentYear = new Date().getFullYear()

export function DatePicker({ value, onChange, disabled, placeholder = "Pick a date", disabledDates }: DatePickerProps) {
  const [month, setMonth] = useState<number>(value ? value.getMonth() : new Date().getMonth())
  const [year, setYear] = useState<number>(value ? value.getFullYear() : currentYear)
  const [isMediumOrMobile, setIsMediumOrMobile] = useState(false)

  useEffect(() => {
    if (value) {
      setMonth(value.getMonth())
      setYear(value.getFullYear())
    }
  }, [value])

  useEffect(() => {
    const handleResize = () => {
      setIsMediumOrMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const years = Array.from({ length: 115 }, (_, i) => (currentYear + 10) - i)

  const handleMonthChange = (m: string) => {
    const monthIndex = months.indexOf(m)
    setMonth(monthIndex)
  }

  const handleYearChange = (y: string) => {
    setYear(parseInt(y))
  }

  const handleSelect = (d: Date | undefined) => {
    onChange(d)
    if (d) {
      setMonth(d.getMonth())
      setYear(d.getFullYear())
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl justify-start text-left font-normal",
            !value && "text-gray-400"
          )}
        >
          <CalendarIcon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align={isMediumOrMobile ? "center" : "start"} side={isMediumOrMobile ? "bottom" : "right"} sideOffset={8}>
        <div className="flex gap-2 mb-3">
          <Select value={months[month]} onValueChange={handleMonthChange}>
            <SelectTrigger className="flex-1 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {months.map((m) => (
                <SelectItem key={m} value={m} className="text-xs py-1 min-h-0">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-20 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()} className="text-xs py-1 min-h-0">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={new Date(year, month)}
          onMonthChange={(d: Date) => {
            setMonth(d.getMonth())
            setYear(d.getFullYear())
          }}
          disabled={disabledDates || ((d: Date) => d < new Date("1900-01-01"))}
        />
      </PopoverContent>
    </Popover>
  )
}
