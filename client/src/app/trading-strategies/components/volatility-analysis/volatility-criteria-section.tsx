import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingDown, BarChart3, Loader2, X } from 'lucide-react';

interface VolatilityCriteriaSectionProps {
  declineDays: string;
  setDeclineDays: (value: string) => void;
  declineRate: string;
  setDeclineRate: (value: string) => void;
  recoveryDays: string;
  setRecoveryDays: (value: string) => void;
  volatilityRate: string;
  setVolatilityRate: (value: string) => void;
  isLoading: boolean;
  showResults: boolean;
  onAnalysis: () => void;
  onReset: () => void;
}

export const VolatilityCriteriaSection = ({
  declineDays,
  setDeclineDays,
  declineRate,
  setDeclineRate,
  recoveryDays,
  setRecoveryDays,
  volatilityRate,
  setVolatilityRate,
  isLoading,
  showResults,
  onAnalysis,
  onReset,
}: VolatilityCriteriaSectionProps) => {
  const handleAnalysisClick = () => {
    if (showResults) {
      onReset();
    } else {
      onAnalysis();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-red-500" />
        <label className="text-sm font-semibold text-red-600">
          변동성 기준
        </label>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-wrap pl-6">
        <div className="grid grid-cols-2 sm:flex sm:items-end gap-4 w-full sm:w-auto">
          <div className="space-y-2">
            <label className="text-xs font-medium text-red-600">
              하락기간(일)
            </label>
            <Input
              type="number"
              value={declineDays}
              onChange={(e) => setDeclineDays(e.target.value)}
              className="w-full sm:w-20 text-center border-red-200 focus:border-red-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-red-600">
              하락률(%)
            </label>
            <Input
              type="number"
              value={declineRate}
              onChange={(e) => setDeclineRate(e.target.value)}
              className="w-full sm:w-20 text-center border-red-200 focus:border-red-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-green-600">
              반등기간(일)
            </label>
            <Input
              type="number"
              value={recoveryDays}
              onChange={(e) => setRecoveryDays(e.target.value)}
              className="w-full sm:w-20 text-center border-green-200 focus:border-green-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-green-600">
              반등률(%)
            </label>
            <Input
              type="number"
              value={volatilityRate}
              onChange={(e) => setVolatilityRate(e.target.value)}
              className="w-full sm:w-20 text-center border-green-200 focus:border-green-400"
            />
          </div>
        </div>

        <div className="w-full sm:w-auto mt-4 sm:mt-0">
          <Button
            onClick={handleAnalysisClick}
            disabled={isLoading}
            className="bg-slate-700 hover:bg-slate-600 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                분석 중...
              </>
            ) : showResults ? (
              <>
                <X className="h-4 w-4 mr-2" />
                초기화
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                분석 실행
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
