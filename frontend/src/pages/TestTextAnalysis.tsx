import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TextFeedbackCard } from '@/components/TextFeedbackCard';

interface TestFeedback {
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

const TestTextAnalysis = () => {
  const [question, setQuestion] = useState('What are your main interests?');
  const [answer, setAnswer] = useState(
    "I'm really into hiking and photography. Last summer I did the Cascades and got stuck in unexpected snow. I also love cooking and trying new recipes on weekends."
  );
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<TestFeedback | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both question and answer',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await api.analyzeTextResponse(
        'test-analysis',
        question,
        answer
      );

      // Transform the response to match TestFeedback interface
      const transformedFeedback: TestFeedback = {
        id: 'test-feedback',
        question: question,
        answer: answer,
        analysis: result.feedback.analysis,
        strengths: result.feedback.strengths,
        suggestions: result.feedback.suggestions,
        metrics: {
          word_count: result.feedback.metrics.word_count,
          sentence_count: answer.split(/[.!?]+/).filter(s => s.trim()).length,
          has_specific_examples: result.feedback.metrics.has_specific_examples,
        },
        personality_context: {
          dating_goal: result.feedback.personality_context.dating_goal,
          conversation_style: result.feedback.personality_context.conversation_style,
          humor_style: 'witty and clever', // default
        },
      };

      setFeedback(transformedFeedback);
      toast({
        title: 'Success!',
        description: 'Text analysis completed',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to analyze text',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" role="main" aria-label="Text analysis test page">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-mesh)' }} />
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6" aria-label="Back to home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden>
              <Sparkles className="w-6 h-6 text-primary" aria-hidden />
            </div>
            <h1 className="text-4xl font-bold" aria-label="Test page title">
              Test Text Analysis
            </h1>
          </div>
          <p className="text-muted-foreground" aria-label="Test page description">
            Test the LLM-powered text feedback system with sample responses
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Section */}
          <Card aria-label="Input card">
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Enter a question and answer to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="question">
                  Question
                </label>
                <Input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What are your main interests?"
                  aria-label="Question input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="answer">
                  Answer
                </label>
                <Textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your answer here..."
                  className="min-h-[200px]"
                  aria-label="Answer input"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full"
                aria-label="Analyze text button"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" aria-hidden />
                    Analyze
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card aria-label="Output card">
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>LLM-powered analysis results</CardDescription>
            </CardHeader>
            <CardContent>
              {!feedback ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground" aria-label="Waiting for input">
                  <p>Click "Analyze" to see feedback here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Analysis</h4>
                    <p className="text-sm text-muted-foreground">{feedback.analysis}</p>
                  </div>

                  {feedback.strengths.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-green-700">Strengths</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {feedback.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-orange-700">Suggestions</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {feedback.suggestions.map((s, i) => (
                          <li key={i}>→ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Full Feedback Display */}
        {feedback && (
          <Card className="mt-8" aria-label="Full feedback card">
            <CardHeader>
              <CardTitle>Full Feedback View</CardTitle>
              <CardDescription>How it looks on the Results page</CardDescription>
            </CardHeader>
            <CardContent>
              <TextFeedbackCard feedback={feedback} index={1} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestTextAnalysis;
