import { Badge } from './ui/badge';

interface QualityScoreBadgeProps {
  score: number;
  label?: string;
  showText?: boolean;
}

export function QualityScoreBadge({ score, label, showText = true }: QualityScoreBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-green-500 hover:bg-green-600';
    if (score >= 50) return 'bg-yellow-500 hover:bg-yellow-600';
    if (score >= 30) return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  const getText = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Poor';
  };

  const getIcon = (score: number) => {
    if (score >= 70) return '✅';
    if (score >= 50) return '👍';
    if (score >= 30) return '⚠️';
    return '❌';
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>}
      <Badge className={`${getColor(score)} text-white border-0`}>
        {getIcon(score)} {score}/100 {showText && `- ${getText(score)}`}
      </Badge>
    </div>
  );
}
