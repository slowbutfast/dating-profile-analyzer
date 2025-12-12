import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  MessageSquare, 
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { PhotoAnalysisCard } from '@/components/PhotoAnalysisCard';
import { AnalysisSummary } from '@/components/AnalysisSummary';
import type { PhotoWithAnalysis } from '@/types/imageAnalysis';

interface Analysis {
  id: string;
  user_id: string;
  bio: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: any;
  updated_at: any;
}

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

const Results = () => {
  const { id } = useParams<{ id: string }>();
  // Remove all supabase references and related logic
  // Demo state
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [textResponses, setTextResponses] = useState<TextResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageAnalysisPhotos, setImageAnalysisPhotos] = useState<PhotoWithAnalysis[]>([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [hasImageAnalysis, setHasImageAnalysis] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAnalysisData();
  }, [id]);

  // Separate effect for polling with timeout
  useEffect(() => {
    if (!analysis) return;
    
    // Only poll if status is pending or processing
    if (analysis.status === 'pending' || analysis.status === 'processing') {
      const pollCount = { current: 0 };
      const maxPolls = 60; // Stop after 5 minutes (60 * 5 seconds)
      
      const interval = setInterval(() => {
        pollCount.current++;
        
        if (pollCount.current >= maxPolls) {
          clearInterval(interval);
          toast({
            title: 'Analysis Taking Longer Than Expected',
            description: 'Please refresh the page to check status',
            variant: 'destructive',
          });
          return;
        }
        
        loadAnalysisData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [analysis?.status]);

  const loadAnalysisData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await api.getAnalysis(id);
      setAnalysis(result.analysis);
      setPhotos(result.photos);
      setTextResponses(result.textResponses);
      
      // Also load image analysis if available
      await loadImageAnalysis();
    } catch (error: any) {
      console.error('Error loading analysis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load analysis',
        variant: 'destructive',
      });
      if (error.message.includes('not found')) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadImageAnalysis = async () => {
    if (!id) return;
    
    try {
      const result = await api.getImageAnalysisResults(id);
      setImageAnalysisPhotos(result.photos);
      setHasImageAnalysis(result.photos.some((p: PhotoWithAnalysis) => p.analysis !== null));
    } catch (error: any) {
      // Image analysis might not be available yet, that's ok
      console.log('Image analysis not yet available:', error);
    }
  };

  const handleAnalyzeImages = async () => {
    if (!id) return;
    
    setAnalyzingImages(true);
    try {
      await api.analyzeImages(id);
      
      toast({
        title: 'Analysis Started',
        description: 'Your photos are being analyzed. This may take a few moments...',
      });
      
      // Poll for results
      setTimeout(async () => {
        await loadImageAnalysis();
        setAnalyzingImages(false);
        
        toast({
          title: 'Analysis Complete',
          description: 'Your photo quality analysis is ready!',
        });
      }, 10000); // Wait 10 seconds for analysis to complete
      
    } catch (error: any) {
      console.error('Error analyzing images:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze images',
        variant: 'destructive',
      });
      setAnalyzingImages(false);
    }
  };

  const renderMetricScore = (label: string, score: number, description?: string) => (
    <div className="space-y-2" role="group" aria-label={`${label} score`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{score}/100</span>
      </div>
      <Progress value={score} className="h-2" aria-valuenow={score} aria-label={`${label} progress`} />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite" aria-label="Loading analysis">
        <div className="text-center">
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  // Demo results content
  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="main" aria-label="No analysis found">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Analysis Found</h2>
          <p className="text-muted-foreground mb-4">Unable to load analysis data. Please try uploading again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" role="main" aria-label="Profile analysis results">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-mesh)' }} />
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} aria-label="Back to Dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold" aria-label="Profile Analysis title">Profile Analysis</h1>
            <Badge 
              variant={analysis.status === 'completed' ? 'default' : 'secondary'}
              className={
                analysis.status === 'completed' ? 'bg-green-500' :
                analysis.status === 'processing' ? 'bg-blue-500' :
                analysis.status === 'failed' ? 'bg-red-500' : ''
              }
              aria-label={`Analysis status: ${analysis.status}`}
            >
              {analysis.status}
            </Badge>
          </div>
          <p className="text-muted-foreground" aria-label="Analysis creation date">
            Created on {new Date(analysis.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Processing Status */}
        {(analysis.status === 'pending' || analysis.status === 'processing') && (
          <Card className="mb-8" role="status" aria-live="polite" aria-label="Analysis processing status">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div>
                  <h3 className="font-semibold">Analysis in Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Your profile is being analyzed. This typically takes 1-3 minutes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed Status */}
        {analysis.status === 'failed' && (
          <Card className="mb-8 border-destructive" role="alert" aria-label="Analysis failed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <XCircle className="w-8 h-8 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">Analysis Failed</h3>
                  <p className="text-sm text-muted-foreground">
                    There was an error analyzing your profile. Please try uploading again.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Quality Analysis */}
        {photos.length > 0 && (
          <div className="mb-8">
            {!hasImageAnalysis && !analyzingImages && (
              <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Analyze Photo Quality</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Get AI-powered insights on your photo quality including blur detection, lighting analysis, and smile recognition.
                      </p>
                      <Button onClick={handleAnalyzeImages} disabled={analyzingImages}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze Photos
                      </Button>
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
                        Running blur detection, lighting analysis, and smile recognition. This may take a moment...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasImageAnalysis && imageAnalysisPhotos.length > 0 && (
              <>
                <AnalysisSummary photos={imageAnalysisPhotos} />
                
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {imageAnalysisPhotos.map((photo) => (
                    <PhotoAnalysisCard key={photo.photoId} photo={photo} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Photo Analysis */}
        {photos.length > 0 && (
          <Card className="mb-8" aria-label="Photo analysis section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" aria-label="Photo Analysis title">
                <ImageIcon className="w-5 h-5" aria-hidden />
                Photo Analysis
              </CardTitle>
              <CardDescription>
                Detailed analysis of your {photos.length} photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="space-y-4" aria-label={`Photo ${index + 1} analysis`}>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={photo.photo_url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/128x128?text=Photo';
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <h4 className="font-semibold">Photo {index + 1}</h4>
                        {photo.analysis_result && analysis.status === 'completed' ? (
                          <div className="space-y-3">
                            {renderMetricScore('Lighting Quality', photo.analysis_result.lighting || 0)}
                            {renderMetricScore('Sharpness', photo.analysis_result.sharpness || 0)}
                            {renderMetricScore('Face Visibility', photo.analysis_result.face_visibility || 0)}
                            {renderMetricScore('Eye Contact', photo.analysis_result.eye_contact || 0)}
                            {photo.analysis_result.notes && (
                              <p className="text-sm text-muted-foreground pt-2">
                                {photo.analysis_result.notes}
                              </p>
                            )}
                          </div>
                        ) : analysis.status === 'completed' ? (
                          <p className="text-sm text-muted-foreground">No analysis data available</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Analyzing...</p>
                        )}
                      </div>
                    </div>
                    {index < photos.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Text Analysis */}
        {textResponses.length > 0 && (
          <Card aria-label="Text analysis section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" aria-label="Text Analysis title">
                <MessageSquare className="w-5 h-5" aria-hidden />
                Text Analysis
              </CardTitle>
              <CardDescription>
                Analysis of your {textResponses.length} prompt responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {textResponses.map((response, index) => (
                  <div key={response.id} className="space-y-4" aria-label={`Response ${index + 1} analysis`}>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{response.question}</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg" aria-label={`Answer to question ${index + 1}`}>
                        "{response.answer}"
                      </p>
                    </div>
                    {response.analysis_result && analysis.status === 'completed' ? (
                      <div className="space-y-3 pl-4 border-l-2 border-primary/20" aria-label={`Analysis metrics for response ${index + 1}`}>
                        {renderMetricScore('Warmth', response.analysis_result.warmth || 0)}
                        {renderMetricScore('Humor', response.analysis_result.humor || 0)}
                        {renderMetricScore('Clarity', response.analysis_result.clarity || 0)}
                        {renderMetricScore('Originality', response.analysis_result.originality || 0)}
                        {renderMetricScore('Conversation Potential', response.analysis_result.conversation_potential || 0)}
                        
                        {response.analysis_result.strengths && (
                          <div className="pt-2">
                            <p className="text-sm font-medium text-green-600 mb-1">Strengths:</p>
                            <p className="text-sm text-muted-foreground">{response.analysis_result.strengths}</p>
                          </div>
                        )}
                        
                        {response.analysis_result.improvements && (
                          <div className="pt-2">
                            <p className="text-sm font-medium text-orange-600 mb-1">Suggestions:</p>
                            <p className="text-sm text-muted-foreground">{response.analysis_result.improvements}</p>
                          </div>
                        )}
                      </div>
                    ) : analysis.status === 'completed' ? (
                      <p className="text-sm text-muted-foreground">No analysis data available</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Analyzing...</p>
                    )}
                    {index < textResponses.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.status === 'completed' && (
          <Card className="mt-8 bg-primary/5 border-primary/20" role="status" aria-live="polite" aria-label="Analysis complete">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Analysis Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your profile has been thoroughly analyzed. Review the metrics above for detailed insights
                    and actionable suggestions to improve your dating profile.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Results;
