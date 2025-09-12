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
  isBasicSettingsComplete: boolean;
  isAllFiltersValid: boolean;
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
  isBasicSettingsComplete,
  isAllFiltersValid,
}: VolatilityCriteriaSectionProps) => {
  const handleAnalysisClick = () => {
    if (showResults) {
      onReset();
    } else {
      onAnalysis();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-red-500" />
        <label className="text-sm font-semibold text-red-600">
          변동성 기준
        </label>
      </div>

      <div className="pl-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {/* 하락 기준 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-red-600">
              하락 기간
            </label>
            <Input
              type="number"
              value={declineDays}
              onChange={(e) => setDeclineDays(e.target.value)}
              disabled={!isBasicSettingsComplete}
              className="text-center border-red-200 focus:border-red-400"
              placeholder="일"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-red-600">하락률</label>
            <Input
              type="number"
              value={declineRate}
              onChange={(e) => setDeclineRate(e.target.value)}
              disabled={!isBasicSettingsComplete}
              className="text-center border-red-200 focus:border-red-400"
              placeholder="%"
              step="0.1"
            />
          </div>

          {/* 반등 기준 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-green-600">
              반등 기간
            </label>
            <Input
              type="number"
              value={recoveryDays}
              onChange={(e) => setRecoveryDays(e.target.value)}
              disabled={!isBasicSettingsComplete}
              className="text-center border-green-200 focus:border-green-400"
              placeholder="일"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-green-600">
              반등률
            </label>
            <Input
              type="number"
              value={volatilityRate}
              onChange={(e) => setVolatilityRate(e.target.value)}
              disabled={!isBasicSettingsComplete}
              className="text-center border-green-200 focus:border-green-400"
              placeholder="%"
              step="0.1"
            />
          </div>
        </div>

        {/* 분석 실행 버튼 */}
        <div className="flex justify-center">
          <Button
            onClick={handleAnalysisClick}
            disabled={isLoading || !isAllFiltersValid}
            size="lg"
            className={
              showResults
                ? 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }
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
};
