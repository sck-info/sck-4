"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
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

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  disabled?: boolean
  placeholder?: string
}

const currentYear = new Date().getFullYear()

export function DateRangePicker({ value, onChange, disabled, placeholder = "Select date range" }: DateRangePickerProps) {
  const [month, setMonth] = useState<number>(
    value?.from ? value.from.getMonth() : new Date().getMonth()
  )
  const [year, setYear] = useState<number>(
    value?.from ? value.from.getFullYear() : currentYear
  )
  const [isMediumOrMobile, setIsMediumOrMobile] = useState(false)

  useEffect(() => {
    if (value?.from) {
      setMonth(value.from.getMonth())
      setYear(value.from.getFullYear())
    }
  }, [value?.from])

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

  const years = Array.from({ length: 30 }, (_, i) => (currentYear + 5) - i)

  const handleMonthChange = (m: string) => {
    const monthIndex = months.indexOf(m)
    setMonth(monthIndex)
  }

  const handleYearChange = (y: string) => {
    setYear(parseInt(y))
  }

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range)
    if (range?.from) {
      setMonth(range.from.getMonth())
      setYear(range.from.getFullYear())
    }
  }

  const formatRangeLabel = () => {
    if (!value?.from) return placeholder
    if (!value?.to) return format(value.from, "dd-MMM-yyyy")
    return `${format(value.from, "dd-MMM-yyyy")} - ${format(value.to, "dd-MMM-yyyy")}`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-10 bg-white border-[#e8dcc4] rounded-xl justify-start text-left font-normal text-xs text-[#5a5e7a]",
            !value?.from && "text-gray-400"
          )}
        >
          <CalendarIcon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <span className="truncate">{formatRangeLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align={isMediumOrMobile ? "center" : "start"} side={isMediumOrMobile ? "bottom" : "right"} sideOffset={8}>
        <Calendar
          mode="range"
          selected={value}
          onSelect={handleSelect}
          month={new Date(year, month)}
          onMonthChange={(d: Date) => {
            setMonth(d.getMonth())
            setYear(d.getFullYear())
          }}
          numberOfMonths={isMediumOrMobile ? 1 : 2}
          disabled={(d: Date) => d < new Date("1900-01-01")}
        />
      </PopoverContent>
    </Popover>
  )
}
