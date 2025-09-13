'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  defaultCalendarDate?: 'today' | 'week-ago' | 'month-ago' | Date;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = '날짜를 선택하세요',
  className,
  defaultCalendarDate,
}: DatePickerProps) {
  const isTextCenter = className?.includes('text-center');
  const [isOpen, setIsOpen] = useState(false);

  // 달력 기본 선택 날짜 계산
  const getDefaultDate = useMemo(() => {
    if (defaultCalendarDate === 'today') {
      return new Date();
    } else if (defaultCalendarDate === 'week-ago') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    } else if (defaultCalendarDate === 'month-ago') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    } else if (defaultCalendarDate instanceof Date) {
      return defaultCalendarDate;
    }
    return undefined;
  }, [defaultCalendarDate]);

  // Popover가 열릴 때 기본값 설정
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !date && getDefaultDate && onSelect) {
      onSelect(getDefaultDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full font-normal',
            isTextCenter
              ? 'justify-center text-center'
              : 'justify-start text-left',
            !date && 'text-muted-foreground',
            className
          )}
        >
          {date ? format(date, 'yyyy. MM. dd') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onSelect?.(selectedDate);
            setIsOpen(false); // 날짜 선택 시 Popover 닫기
          }}
          defaultMonth={date || getDefaultDate}
        />
      </PopoverContent>
    </Popover>
  );
}
