import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiStatus } from '@/types/types';

interface ApiStatusIndicatorProps {
  status: ApiStatus;
  className?: string;
}

export const ApiStatusIndicator = ({
  status,
  className,
}: ApiStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: Loader2,
          text: '연결중',
          className: 'text-gray-500 animate-spin',
        };
      case 'connected':
        return {
          icon: Wifi,
          text: '연결됨',
          className: 'text-green-600',
        };
      case 'error':
        return {
          icon: WifiOff,
          text: '연결실패',
          className: 'text-red-600',
        };
    }
  };

  const { icon: Icon, text, className: statusClassName } = getStatusConfig();

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <Icon className={cn('h-4 w-4', statusClassName)} />
      <span className={cn('text-xs font-medium', statusClassName)}>{text}</span>
    </div>
  );
}
