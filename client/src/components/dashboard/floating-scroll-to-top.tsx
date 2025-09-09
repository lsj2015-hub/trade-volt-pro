'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingScrollToTopProps {
  className?: string;
  showAfter?: number; // 스크롤 위치 (px)
}

export const FloatingScrollToTop = ({
  className,
  showAfter = 200,
}: FloatingScrollToTopProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg',
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90 hover:shadow-xl',
        'transition-all duration-300 ease-in-out',
        'border-2 border-primary/20',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none',
        className
      )}
    >
      <ArrowUp className="h-5 w-5" />
      <span className="sr-only">맨 위로 이동</span>
    </Button>
  );
};
