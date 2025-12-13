import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface Photo {
  id: string;
  analysis_id: string;
  photo_url: string;
  storage_path: string;
  order_index: number;
  analysis_result?: {
    lighting: number;
    sharpness: number;
    face_visibility: number;
    eye_contact: number;
    notes: string;
  };
  created_at: any;
}

interface TextResponse {
  id: string;
  analysis_id: string;
  question: string;
  answer: string;
  analysis_result?: {
    warmth: number;
    humor: number;
    clarity: number;
    originality: number;
    conversation_potential: number;
    strengths: string;
    improvements: string;
  };
  created_at: any;
}

interface Analysis {
  id: string;
  user_id: string;
  bio: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: any;
  updated_at: any;
}

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

interface ResultsContentProps {
  analysis: Analysis | null;
  textResponses: TextResponse[];
  textFeedback: Record<string, TextFeedback>;
  photos: Photo[];
  imageAnalysisPhotos?: any[];
  hasImageAnalysis?: boolean;
  analyzingImages?: boolean;
  analyzingText?: boolean;
  onAnalyzeImages?: () => void;
  showPhotosSection?: boolean;
}

/**
 * ResultsContent - Shared rendering component for profile analysis results
 * Used by both Results.tsx and TestResultsVisualization.tsx
 */
export const ResultsContent = ({
  analysis,
  textResponses,
  textFeedback,
  photos,
  imageAnalysisPhotos = [],
  hasImageAnalysis = false,
  analyzingImages = false,
  analyzingText = false,
  onAnalyzeImages,
  showPhotosSection = true,
}: ResultsContentProps) => {
  return (
    <>
      {/* Profile Card with Bio and Text Responses */}
      {(analysis?.bio || textResponses.length > 0) && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-8">
              {/* Bio Section */}
              {analysis?.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">About</h3>
                  <p className="text-muted-foreground leading-relaxed">{analysis.bio}</p>
                </div>
              )}

              {/* Text Responses Section */}
              {textResponses.length > 0 && (
                <div className="space-y-4">
                  {analysis?.bio && <Separator />}
                  {textResponses.map((response, index) => {
                    const feedback = textFeedback[response.id];
                    const hasAnswer = response.answer && response.answer.trim().length > 0;

                    return (
                      <div
                        key={response.id}
                        className="space-y-4"
                        aria-label={`Response ${index + 1} analysis`}
                      >
                        <div className="space-y-2">
                          <h4 className="font-semibold">{response.question}</h4>
                          {hasAnswer ? (
                            <p
                              className="text-sm text-muted-foreground bg-muted p-3 rounded-lg"
                              aria-label={`Answer to question ${index + 1}`}
                            >
                              "{response.answer}"
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No response provided
                            </p>
                          )}
                        </div>

                        {hasAnswer && feedback ? (
                          <div
                            className="space-y-3 pl-4 border-l-2 border-primary/20"
                            aria-label={`LLM analysis for response ${index + 1}`}
                          >
                            {/* Main Analysis */}
                            <div>
                              <p className="text-sm font-medium text-primary mb-1">
                                Analysis:
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {feedback.analysis}
                              </p>
                            </div>

                            {/* Metrics if available */}
                            {feedback.metrics && (
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">
                                  Response Metrics:
                                </p>
                                <ul className="text-sm text-muted-foreground space-y-1 pl-3">
                                  <li>• Word count: {feedback.metrics.word_count}</li>
                                  <li>
                                    • Has specific examples:{' '}
                                    {feedback.metrics.has_specific_examples ? 'Yes' : 'No'}
                                  </li>
                                </ul>
                              </div>
                            )}

                            {/* Strengths */}
                            {feedback.strengths && feedback.strengths.length > 0 && (
                              <div className="pt-2">
                                <p className="text-sm font-medium text-green-600 mb-2">
                                  Strengths:
                                </p>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                                  {feedback.strengths.map((strength: string, i: number) => (
                                    <li key={i}>{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Suggestions */}
                            {feedback.suggestions && feedback.suggestions.length > 0 && (
                              <div className="pt-2">
                                <p className="text-sm font-medium text-orange-600 mb-2">
                                  Suggestions for Improvement:
                                </p>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                                  {feedback.suggestions.map((suggestion: string, i: number) => (
                                    <li key={i}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : hasAnswer && analyzingText ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing response...
                          </p>
                        ) : hasAnswer ? (
                          <p className="text-sm text-muted-foreground">No analysis data available</p>
                        ) : null}

                        {index < textResponses.length - 1 && <Separator className="mt-6" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Section */}
      {showPhotosSection && photos.length > 0 && (
        <div className="mb-8">
          {!hasImageAnalysis && !analyzingImages && onAnalyzeImages && (
            <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0 mt-1">✨</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Analyze Photo Quality</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get AI-powered insights on your photo quality including blur detection,
                      lighting analysis, and smile recognition.
                    </p>
                    <button
                      onClick={onAnalyzeImages}
                      disabled={analyzingImages}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      ✨ Analyze Photos
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {analyzingImages && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <div>
                    <h3 className="font-semibold">Analyzing Photo Quality...</h3>
                    <p className="text-sm text-muted-foreground">
                      Running blur detection, lighting analysis, and smile recognition. This may
                      take a moment...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {hasImageAnalysis && imageAnalysisPhotos.length > 0 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {imageAnalysisPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg border flex items-center justify-center flex-col gap-2"
                  >
                    <div className="text-slate-500 text-4xl">📷</div>
                    <div className="text-xs text-slate-600 text-center px-2 font-mono break-all">
                      {typeof photo === 'string'
                        ? photo.split('/').pop()
                        : photo.photoUrl?.split('/').pop() || 'photo'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ResultsContent;
