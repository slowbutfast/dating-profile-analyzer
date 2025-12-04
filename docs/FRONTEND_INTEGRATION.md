# Frontend Integration Guide for Image Analysis

## Overview

This guide shows how to integrate the image analysis feature into your frontend React application.

## Step 1: Create API Helper Functions

Add these functions to `frontend/src/lib/api.ts`:

```typescript
// Image Analysis API calls

export interface ImageAnalysisResult {
  photoId: string;
  photoUrl: string;
  analysis: {
    blur: {
      score: number;
      severity: 'sharp' | 'slight-blur' | 'blurry' | 'very-blurry';
      isBlurry: boolean;
    };
    lighting: {
      score: number;
      isGoodLighting: boolean;
      brightness: number;
      contrast: number;
      issues: string[];
    };
    smile: {
      score: number;
      hasSmile: boolean;
      confidence: 'no-face' | 'neutral' | 'slight-smile' | 'clear-smile';
      faceDetected: boolean;
      expressions?: {
        happy: number;
        neutral: number;
        sad: number;
        angry: number;
        surprised: number;
      };
    };
    overallScore: number;
    warnings: string[];
  };
}

/**
 * Trigger image analysis for an analysis
 */
export async function analyzeImages(analysisId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/image-analysis/${analysisId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to analyze images');
  }

  return response.json();
}

/**
 * Get image analysis results for an analysis
 */
export async function getImageAnalysisResults(analysisId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/image-analysis/analysis/${analysisId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch image analysis results');
  }

  return response.json();
}

/**
 * Get image analysis for a specific photo
 */
export async function getPhotoAnalysis(photoId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/image-analysis/photo/${photoId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch photo analysis');
  }

  return response.json();
}
```

## Step 2: Create UI Components

### Quality Score Badge Component

Create `frontend/src/components/QualityScoreBadge.tsx`:

```tsx
import React from 'react';
import { Badge } from './ui/badge';

interface QualityScoreBadgeProps {
  score: number;
  label?: string;
}

export function QualityScoreBadge({ score, label }: QualityScoreBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getText = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-600">{label}:</span>}
      <Badge className={getColor(score)}>
        {score}/100 - {getText(score)}
      </Badge>
    </div>
  );
}
```

### Photo Analysis Card Component

Create `frontend/src/components/PhotoAnalysisCard.tsx`:

```tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { QualityScoreBadge } from './QualityScoreBadge';
import { Progress } from './ui/progress';
import type { ImageAnalysisResult } from '../lib/api';

interface PhotoAnalysisCardProps {
  photo: ImageAnalysisResult;
}

export function PhotoAnalysisCard({ photo }: PhotoAnalysisCardProps) {
  const { analysis } = photo;

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Analysis not yet available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <img
          src={photo.photoUrl}
          alt="Profile photo"
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
        <CardTitle className="flex items-center justify-between">
          <span>Photo Quality Analysis</span>
          <QualityScoreBadge score={analysis.overallScore} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Blur Score */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Sharpness</span>
            <span className="text-sm text-gray-600">{analysis.blur.score}/100</span>
          </div>
          <Progress value={analysis.blur.score} />
          <p className="text-xs text-gray-500 mt-1">
            {analysis.blur.severity === 'sharp' && '✅ Image is sharp and clear'}
            {analysis.blur.severity === 'slight-blur' && '⚠️ Slightly blurry'}
            {analysis.blur.severity === 'blurry' && '❌ Blurry - consider a sharper photo'}
            {analysis.blur.severity === 'very-blurry' && '❌ Very blurry - please replace'}
          </p>
        </div>

        {/* Lighting Score */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Lighting</span>
            <span className="text-sm text-gray-600">{analysis.lighting.score}/100</span>
          </div>
          <Progress value={analysis.lighting.score} />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <p>Brightness: {analysis.lighting.brightness}/100</p>
            <p>Contrast: {analysis.lighting.contrast}/100</p>
            {analysis.lighting.issues.length > 0 && (
              <div className="text-orange-600">
                {analysis.lighting.issues.map((issue, i) => (
                  <p key={i}>⚠️ {issue}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Smile Score */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Smile</span>
            <span className="text-sm text-gray-600">{analysis.smile.score}/100</span>
          </div>
          <Progress value={analysis.smile.score} />
          <p className="text-xs text-gray-500 mt-1">
            {!analysis.smile.faceDetected && '❌ No face detected'}
            {analysis.smile.faceDetected && analysis.smile.confidence === 'clear-smile' && '😊 Clear smile - great!'}
            {analysis.smile.faceDetected && analysis.smile.confidence === 'slight-smile' && '🙂 Slight smile'}
            {analysis.smile.faceDetected && analysis.smile.confidence === 'neutral' && '😐 Neutral expression'}
          </p>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <Alert variant="warning">
            <AlertDescription>
              <div className="space-y-1">
                {analysis.warnings.map((warning, i) => (
                  <p key={i} className="text-sm">⚠️ {warning}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

## Step 3: Update Results Page

Update `frontend/src/pages/Results.tsx` to show image analysis:

```tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getImageAnalysisResults, analyzeImages } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PhotoAnalysisCard } from '../components/PhotoAnalysisCard';
import { Button } from '../components/ui/button';

export function Results() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadAnalysisResults();
  }, [analysisId]);

  const loadAnalysisResults = async () => {
    if (!user || !analysisId) return;
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await getImageAnalysisResults(analysisId, token);
      setPhotos(data.photos);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeImages = async () => {
    if (!user || !analysisId) return;
    
    setAnalyzing(true);
    try {
      const token = await user.getIdToken();
      await analyzeImages(analysisId, token);
      
      // Reload results after analysis
      setTimeout(loadAnalysisResults, 2000);
    } catch (error) {
      console.error('Error analyzing images:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const hasAnalysis = photos.some(p => p.analysis);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Analysis Results</h1>

      {!hasAnalysis && (
        <div className="mb-6">
          <Button 
            onClick={handleAnalyzeImages}
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Photos'}
          </Button>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <PhotoAnalysisCard key={photo.photoId} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Step 4: Update Upload Flow

Modify `frontend/src/pages/Upload.tsx` to trigger analysis after upload:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!user) return;
  
  setUploading(true);
  try {
    const token = await user.getIdToken();
    
    // Upload profile
    const formData = new FormData();
    formData.append('userId', user.uid);
    formData.append('bio', bio);
    photos.forEach(photo => formData.append('photos', photo));
    
    const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    const { analysisId } = await uploadResponse.json();
    
    // Trigger image analysis
    await analyzeImages(analysisId, token);
    
    // Navigate to results
    navigate(`/results/${analysisId}`);
  } catch (error) {
    console.error('Upload error:', error);
    // Show error to user
  } finally {
    setUploading(false);
  }
};
```

## Step 5: Add Progress Indicator

Create `frontend/src/components/AnalysisProgress.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { Progress } from './ui/progress';

interface AnalysisProgressProps {
  totalPhotos: number;
  onComplete?: () => void;
}

export function AnalysisProgress({ totalPhotos, onComplete }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Analyzing images...');

  useEffect(() => {
    // Simulate progress (in reality, you'd poll the API)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('Analysis complete!');
          onComplete?.();
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{status}</p>
      <Progress value={progress} />
      <p className="text-xs text-gray-500">
        Analyzing {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
```

## Step 6: Display Summary Statistics

Create `frontend/src/components/AnalysisSummary.tsx`:

```tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { ImageAnalysisResult } from '../lib/api';

interface AnalysisSummaryProps {
  photos: ImageAnalysisResult[];
}

export function AnalysisSummary({ photos }: AnalysisSummaryProps) {
  const photosWithAnalysis = photos.filter(p => p.analysis);
  
  if (photosWithAnalysis.length === 0) {
    return null;
  }

  const avgOverall = photosWithAnalysis.reduce((sum, p) => 
    sum + p.analysis.overallScore, 0) / photosWithAnalysis.length;
  
  const avgBlur = photosWithAnalysis.reduce((sum, p) => 
    sum + p.analysis.blur.score, 0) / photosWithAnalysis.length;
  
  const avgLighting = photosWithAnalysis.reduce((sum, p) => 
    sum + p.analysis.lighting.score, 0) / photosWithAnalysis.length;
  
  const avgSmile = photosWithAnalysis.reduce((sum, p) => 
    sum + p.analysis.smile.score, 0) / photosWithAnalysis.length;

  const photosWithSmile = photosWithAnalysis.filter(p => 
    p.analysis.smile.hasSmile).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold">{Math.round(avgOverall)}</p>
            <p className="text-sm text-gray-600">Overall Quality</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{Math.round(avgBlur)}</p>
            <p className="text-sm text-gray-600">Avg Sharpness</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{Math.round(avgLighting)}</p>
            <p className="text-sm text-gray-600">Avg Lighting</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {photosWithSmile}/{photosWithAnalysis.length}
            </p>
            <p className="text-sm text-gray-600">Photos with Smile</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Complete Workflow

1. User uploads photos → **Immediate format validation**
2. Photos stored in Firebase → Returns `analysisId`
3. Trigger image analysis → `POST /api/image-analysis/:analysisId`
4. Show progress indicator → Poll or wait for completion
5. Display results → Show scores, warnings, and recommendations
6. Allow user to review → Can re-upload specific photos if needed

## Styling Recommendations

### Score Color Scheme
- **Green (70-100)**: Excellent quality
- **Yellow (50-69)**: Good quality
- **Orange (30-49)**: Fair quality, improvements suggested
- **Red (0-29)**: Poor quality, replacement recommended

### Warning Icons
- ⚠️ for warnings
- ❌ for critical issues
- ✅ for good scores
- 😊 for smile detection

## Best Practices

1. **Show analysis results immediately** after upload completes
2. **Allow users to re-analyze** if they update photos
3. **Provide actionable feedback** with specific suggestions
4. **Don't block submission** on low scores - just warn
5. **Show progress indicators** during analysis
6. **Cache results** to avoid re-analyzing unchanged photos

## Error Handling

```tsx
try {
  await analyzeImages(analysisId, token);
} catch (error) {
  // Show user-friendly error
  toast.error('Failed to analyze images. Please try again.');
  
  // Log for debugging
  console.error('Analysis error:', error);
}
```

## Performance Tips

1. **Lazy load** photo analysis cards
2. **Show thumbnails** instead of full-size images
3. **Paginate** for profiles with many photos
4. **Cache** analysis results in localStorage
5. **Debounce** re-analysis requests
