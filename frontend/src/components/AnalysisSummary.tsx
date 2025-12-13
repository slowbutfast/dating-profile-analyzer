import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { PhotoWithAnalysis } from '../types/imageAnalysis';

interface AnalysisSummaryProps {
  photos: PhotoWithAnalysis[];
}

export function AnalysisSummary({ photos }: AnalysisSummaryProps) {
  const photosWithAnalysis = photos.filter(p => p.analysis);
  
  if (photosWithAnalysis.length === 0) {
    return null;
  }

  const avgOverall = Math.round(
    photosWithAnalysis.reduce((sum, p) => sum + (p.analysis?.overallScore || 0), 0) / photosWithAnalysis.length
  );
  
  const avgBlur = Math.round(
    photosWithAnalysis.reduce((sum, p) => sum + (p.analysis?.blur.score || 0), 0) / photosWithAnalysis.length
  );
  
  const avgLighting = Math.round(
    photosWithAnalysis.reduce((sum, p) => sum + (p.analysis?.lighting.score || 0), 0) / photosWithAnalysis.length
  );
  
  const avgSmile = Math.round(
    photosWithAnalysis.reduce((sum, p) => sum + (p.analysis?.smile.score || 0), 0) / photosWithAnalysis.length
  );

  const photosWithSmile = photosWithAnalysis.filter(p => 
    p.analysis?.smile.confidence && p.analysis.smile.confidence !== 'neutral' && p.analysis.smile.confidence !== 'no-face'
  ).length;

  const photosWithFace = photosWithAnalysis.filter(p => 
    p.analysis?.smile.faceDetected
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{avgOverall}</p>
            <p className="text-sm text-gray-600">Overall Quality</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{avgBlur}</p>
            <p className="text-sm text-gray-600">Avg Sharpness</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{avgLighting}</p>
            <p className="text-sm text-gray-600">Avg Lighting</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {photosWithSmile}/{photosWithFace}
            </p>
            <p className="text-sm text-gray-600">Photos with Smile</p>
          </div>
        </div>

        {avgOverall < 50 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-800">💡 Recommendation</p>
            <p className="text-sm text-orange-700 mt-1">
              Your profile could benefit from higher quality photos. Consider replacing photos with low scores.
            </p>
          </div>
        )}

        {photosWithSmile < photosWithFace / 2 && photosWithFace > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
            <p className="text-sm font-medium text-blue-800">😊 Tip</p>
            <p className="text-sm text-blue-700 mt-1">
              Profiles with more smiling photos tend to get better engagement. Consider adding more photos where you're smiling!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
