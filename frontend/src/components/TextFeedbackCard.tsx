import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Lightbulb, CheckCircle2 } from 'lucide-react';

interface TextFeedback {
  id: string;
  question: string;
  answer: string;
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
    humor_style: string;
  };
}

interface TextFeedbackCardProps {
  feedback: TextFeedback;
  index?: number;
}

/**
 * TextFeedbackCard - Displays comprehensive text analysis feedback on the Results page
 * Shows the original prompt/answer, analysis, strengths, and suggestions
 */
export const TextFeedbackCard = ({ feedback, index = 1 }: TextFeedbackCardProps) => {
  return (
    <div className="space-y-4" aria-label={`Response ${index} feedback`}>
      {/* Original Prompt and Answer */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h4 className="font-semibold text-base" aria-label={`Question ${index}`}>
            {feedback.question}
          </h4>
          <div className="bg-muted p-3 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground" aria-label={`Answer to question ${index}`}>
              "{feedback.answer}"
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs" aria-label="Word count">
            {feedback.metrics.word_count} words
          </Badge>
          <Badge variant="secondary" className="text-xs" aria-label="Sentence count">
            {feedback.metrics.sentence_count} sentences
          </Badge>
          {feedback.metrics.has_specific_examples && (
            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700" aria-label="Has specific examples">
              Specific Examples ✓
            </Badge>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Main Analysis Feedback */}
      <div className="space-y-3 pl-4 border-l-2 border-primary/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" aria-hidden />
            <h5 className="font-semibold text-sm">Analysis</h5>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" aria-label="LLM analysis feedback">
            {feedback.analysis}
          </p>
        </div>

        {/* Context Note */}
        {feedback.personality_context && (
          <div className="pt-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded">
            <p>
              <span className="font-medium">Personalized for:</span> {feedback.personality_context.dating_goal} •{' '}
              {feedback.personality_context.conversation_style}
            </p>
          </div>
        )}
      </div>

      {/* Strengths Section */}
      {feedback.strengths.length > 0 && (
        <div className="space-y-3 pl-4 border-l-2 border-green-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden />
            <h5 className="font-semibold text-sm text-green-700">Strengths</h5>
          </div>
          <ul className="space-y-2">
            {feedback.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex gap-3" aria-label={`Strength ${idx + 1}`}>
                <span className="text-green-600 font-semibold flex-shrink-0">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions Section */}
      {feedback.suggestions.length > 0 && (
        <div className="space-y-3 pl-4 border-l-2 border-orange-500/20">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-orange-600 flex-shrink-0" aria-hidden />
            <h5 className="font-semibold text-sm text-orange-700">Suggestions for Improvement</h5>
          </div>
          <ul className="space-y-2">
            {feedback.suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex gap-3" aria-label={`Suggestion ${idx + 1}`}>
                <span className="text-orange-600 font-semibold flex-shrink-0">→</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TextFeedbackCard;
