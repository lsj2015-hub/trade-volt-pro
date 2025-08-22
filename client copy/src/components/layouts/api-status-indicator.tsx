import { Wifi, WifiOff, Loader2, CircleIcon } from 'lucide-react';
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
          icon: CircleIcon,
          text: '연결중',
          className: 'text-gray-50 fill-gray-50',
        };
      case 'connected':
        return {
          icon: CircleIcon,
          text: '연결됨',
          className: 'text-green-600 fill-green-600',
        };
      case 'error':
        return {
          icon: CircleIcon,
          text: '연결실패',
          className: 'text-red-600 fill-red-600',
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
