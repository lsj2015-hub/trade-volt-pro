'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
}

export function DatePicker({
  date,
  onSelect,
  placeholder = '날짜를 선택하세요',
  className,
}: DatePickerProps) {
  const isTextCenter = className?.includes('text-center');

  return (
    <Popover>
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
          {date ? (
            format(date, 'yyyy년 MM월 dd일', { locale: ko })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  );
}
