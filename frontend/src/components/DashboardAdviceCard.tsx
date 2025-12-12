import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

interface TextFeedback {
  id: string;
  analysis: string;
  strengths: string[];
  suggestions: string[];
  metrics: {
    word_count: number;
    sentence_count: number;
    has_specific_examples: boolean;
  };
  personality_context: {
    dating_goal: string;
    conversation_style: string;
  };
}

interface DashboardAdviceCardProps {
  feedback: TextFeedback;
  onViewDetails: () => void;
}

/**
 * DashboardAdviceCard - Displays a quick summary of text analysis feedback on the Dashboard
 * Shows the main analysis insight and key strengths with a link to full details
 */
export const DashboardAdviceCard = ({ feedback, onViewDetails }: DashboardAdviceCardProps) => {
  // Extract first 1-2 sentences from analysis for summary
  const getSummary = (analysis: string): string => {
    const sentences = analysis.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  };

  const summary = getSummary(feedback.analysis);

  return (
    <Card className="hover:border-primary/40 transition-all" aria-label="Text feedback summary card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1" aria-hidden>
              <Sparkles className="w-5 h-5 text-primary" aria-hidden />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base" aria-label="Text analysis title">Text Analysis Feedback</CardTitle>
              <CardDescription className="text-xs" aria-label="Analysis metrics">
                {feedback.metrics.word_count} words • {feedback.metrics.sentence_count} sentences
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Insight */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed" aria-label="Analysis summary">
              {summary}
            </p>
          </div>

          {/* Key Strengths Preview */}
          {feedback.strengths.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Top Strength</p>
              <p className="text-sm text-muted-foreground" aria-label="First strength">
                • {feedback.strengths[0]}
              </p>
            </div>
          )}

          {/* View Details Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="w-full justify-center gap-2"
            aria-label="View full text analysis details"
          >
            View Full Analysis
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardAdviceCard;
