import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { QualityScoreBadge } from './QualityScoreBadge';
import { Progress } from './ui/progress';
import type { PhotoWithAnalysis } from '../types/imageAnalysis';

interface PhotoAnalysisCardProps {
  photo: PhotoWithAnalysis;
}

export function PhotoAnalysisCard({ photo }: PhotoAnalysisCardProps) {
  const { analysis } = photo;

  // Construct full image URL
  const imageUrl = photo.photoUrl.startsWith('http') 
    ? photo.photoUrl 
    : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001'}${photo.photoUrl}`;

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-4">
          <img
            src={imageUrl}
            alt="Profile photo"
            className="w-full h-48 object-cover rounded-lg mb-4"
            onError={(e) => {
              console.error('Failed to load image:', photo.photoUrl);
              e.currentTarget.src = 'https://placehold.co/400x300?text=Photo';
            }}
          />
          <p className="text-sm text-gray-500">Analysis not yet available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <img
          src={imageUrl}
          alt="Profile photo"
          className="w-full h-48 object-cover rounded-lg mb-4"
          onError={(e) => {
            console.error('Failed to load image:', photo.photoUrl);
            e.currentTarget.src = 'https://placehold.co/400x300?text=Photo';
          }}
        />
        <CardTitle className="flex items-center justify-between">
          <span>Photo Quality</span>
          <QualityScoreBadge score={analysis.overallScore} showText={false} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Blur Score */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Sharpness</span>
            <span className="text-sm text-gray-600">{analysis.blur.score}/100</span>
          </div>
          <Progress value={analysis.blur.score} className="h-2" />
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
          <Progress value={analysis.lighting.score} className="h-2" />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <p>Brightness: {analysis.lighting.brightness}/100 • Contrast: {analysis.lighting.contrast}/100</p>
            {analysis.lighting.issues.length > 0 && (
              <div className="text-gray-500">
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
          <Progress value={analysis.smile.score} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {!analysis.smile.faceDetected && '❌ No face detected'}
            {analysis.smile.faceDetected && analysis.smile.confidence === 'clear-smile' && '😊 Clear smile - great!'}
            {analysis.smile.faceDetected && analysis.smile.confidence === 'slight-smile' && '🙂 Slight smile'}
            {analysis.smile.faceDetected && analysis.smile.confidence === 'neutral' && '😐 Neutral expression'}
          </p>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-sm">Recommendations:</p>
                {analysis.warnings.map((warning, i) => (
                  <p key={i} className="text-sm">• {warning}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
