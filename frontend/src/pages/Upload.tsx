import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { db } from '@/integrations/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Onboarding from './Onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload as UploadIcon, X, Image as ImageIcon, Camera, MessageSquare, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { FloatingHeartsBackgroundUpload } from '@/components/ui/floating-hearts-background';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const uploadSchema = z.object({
  photos: z.array(z.any()).min(3, 'Upload at least 3 photos').max(6, 'Maximum 6 photos'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().or(z.literal('')),
  textResponses: z.array(z.object({
    question: z.string().trim().min(1, 'Question cannot be empty').max(200),
    answer: z.string().trim().min(1, 'Answer cannot be empty').max(1000),
  })).optional().or(z.array(z.any()).length(0)),
});

const Upload = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<File[]>([]);
  const [bio, setBio] = useState('');
  const [textResponses, setTextResponses] = useState<{ question: string; answer: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hasPersonalityProfile, setHasPersonalityProfile] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user has completed personality onboarding
  useEffect(() => {
    const checkPersonalityProfile = async () => {
      if (!user) return;
      
      try {
        const personalityRef = doc(db, 'user_personalities', user.uid);
        const personalityDoc = await getDoc(personalityRef);
        setHasPersonalityProfile(personalityDoc.exists());
      } catch (error) {
        console.error('Error checking personality profile:', error);
        setHasPersonalityProfile(false);
      }
    };

    checkPersonalityProfile();
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported image format`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (photos.length + validFiles.length > 6) {
      toast({
        title: 'Too many photos',
        description: 'Maximum 6 photos allowed',
        variant: 'destructive',
      });
      return;
    }

    setPhotos([...photos, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const addTextResponse = () => {
    if (textResponses.length < 5) {
      setTextResponses([...textResponses, { question: '', answer: '' }]);
    }
  };

  const removeTextResponse = (index: number) => {
    setTextResponses(textResponses.filter((_, i) => i !== index));
  };

  const updateTextResponse = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...textResponses];
    updated[index][field] = value;
    setTextResponses(updated);
  };

  const performUpload = async (filteredResponses: any[]) => {
    if (!user) return;
    
    setUploading(true);
    try {
      console.log('Starting upload with:', {
        userId: user.uid,
        photoCount: photos.length,
        bioLength: bio.trim().length,
        responseCount: filteredResponses.length
      });
      
      const result = await api.upload(user.uid, photos, bio.trim(), filteredResponses);
      
      console.log('Upload result:', result);

      toast({
        title: 'Upload successful!',
        description: 'Your profile is being analyzed. This may take a few minutes.',
      });

      // Automatically trigger image analysis
      try {
        await api.analyzeImages(result.analysisId);
        console.log('Image analysis triggered successfully');
      } catch (analysisError) {
        console.error('Failed to trigger image analysis:', analysisError);
        // Don't block navigation if image analysis fails
      }

      // Automatically trigger text analysis for each response
      try {
        for (const response of filteredResponses) {
          await api.analyzeTextResponse(
            result.analysisId,
            response.question,
            response.answer
          );
        }
        console.log('Text analysis triggered successfully for all responses');
      } catch (textAnalysisError) {
        console.error('Failed to trigger text analysis:', textAnalysisError);
        // Don't block navigation if text analysis fails - it can happen asynchronously
      }

      navigate(`/results/${result.analysisId}`);
    } catch (error: any) {
      console.error('Upload error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error
      });
      
      let errorMessage = 'Please try again';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString().includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
      } else if (error.status) {
        errorMessage = `Server error (${error.status}): ${error.statusText || 'Unknown error'}`;
      }
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setPendingUpload(false);
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setHasPersonalityProfile(true);
    
    if (pendingUpload) {
      const filteredResponses = textResponses.filter(tr => tr.question.trim() && tr.answer.trim());
      await performUpload(filteredResponses);
    }
  };

  const handleOnboardingSkip = async () => {
    setShowOnboarding(false);
    
    if (pendingUpload) {
      const filteredResponses = textResponses.filter(tr => tr.question.trim() && tr.answer.trim());
      await performUpload(filteredResponses);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);

    try {
      // Validate input - only include responses where BOTH question AND answer are filled
      const filteredResponses = textResponses.filter(tr => tr.question.trim() && tr.answer.trim());
      uploadSchema.parse({
        photos,
        bio: bio.trim() || undefined,
        textResponses: filteredResponses.length > 0 ? filteredResponses : undefined,
      });

      // Check if user has completed personality onboarding
      if (hasPersonalityProfile === false) {
        toast({
          title: 'One more step!',
          description: 'Please complete your personality profile for more personalized insights.',
        });
        
        // Open onboarding dialog and mark upload as pending
        setPendingUpload(true);
        setShowOnboarding(true);
        setUploading(false);
        return;
      }

      // Upload to backend API
      await performUpload(filteredResponses);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Upload error:', error);
        toast({
          title: 'Upload failed',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with floating hearts */}
      <FloatingHeartsBackgroundUpload />

      <div className="container max-w-4xl mx-auto py-10 relative" aria-label="Upload profile page">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" aria-label="Upload title">Upload Your Profile</h1>
          <p className="text-lg text-muted-foreground" aria-label="Upload description">
            Submit your profile content for analysis. We'll evaluate what's working well and provide recommendations for improvement.
          </p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-8" aria-label="Upload form">
        {/* Photo Upload Section */}
        <Card className="border-2 hover:border-primary/20 transition-all shadow-sm hover:shadow-lg" aria-label="Profile photos card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-1" aria-label="Profile photos title">Profile Photos</CardTitle>
                <CardDescription aria-label="Profile photos description">
                  Upload 3-6 photos from your profile for comprehensive analysis
                </CardDescription>
              </div>
              <div className="text-lg font-semibold text-primary">
                {photos.length}/6
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-label="Uploaded photos grid">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group" aria-label={`Uploaded photo ${index + 1}`}>
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(index)}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {photos.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group" aria-label="Add photo">
                  <div className="text-center">
                    <div className="text-5xl text-primary mb-2 group-hover:scale-110 transition-transform">+</div>
                    <p className="text-sm font-medium text-muted-foreground">Add Photo</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                    aria-label="Photo file input"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        <Card className="border-2 hover:border-primary/20 transition-all shadow-sm hover:shadow-lg" aria-label="Bio card">
          <CardHeader>
            <CardTitle className="text-2xl mb-1" aria-label="Bio title">Profile Bio (Optional)</CardTitle>
            <CardDescription aria-label="Bio description">
              Include your bio or about section to help us evaluate your written presentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your profile bio..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[200px]"
              aria-label="Profile bio textarea"
            />
          </CardContent>
        </Card>

        {/* Text Responses Section */}
        <Card className="border-2 hover:border-primary/20 transition-all shadow-sm hover:shadow-lg" aria-label="Text responses card">
          <CardHeader>
            <CardTitle className="text-2xl mb-1" aria-label="Text responses title">Prompt Responses (Optional)</CardTitle>
            <CardDescription aria-label="Text responses description">
              Add your responses to profile prompts for a more comprehensive text analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {textResponses.map((response, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg" aria-label={`Text response ${index + 1}`}>
                <div className="flex justify-between items-start">
                  <Label aria-label={`Response ${index + 1} label`}>Response {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTextResponse(index)}
                    aria-label={`Remove response ${index + 1}`}
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Question/Prompt"
                  value={response.question}
                  onChange={(e) => updateTextResponse(index, 'question', e.target.value)}
                  aria-label={`Response ${index + 1} question input`}
                />
                <Textarea
                  placeholder="Your answer"
                  value={response.answer}
                  onChange={(e) => updateTextResponse(index, 'answer', e.target.value)}
                  className="min-h-[100px]"
                  aria-label={`Response ${index + 1} answer input`}
                />
              </div>
            ))}
            
            {textResponses.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={addTextResponse}
                className="w-full"
                aria-label="Add text response"
              >
                + Add Text Response
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex flex-col items-center gap-2 pt-4" aria-label="Submit area">
          <Button 
            type="submit" 
            disabled={uploading || photos.length < 3} 
            size="lg" 
            className="text-lg px-12 py-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            aria-label="Analyze my profile"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Analyzing Profile...
              </>
            ) : (
              <>
                Submit
              </>
            )}
          </Button>
          {photos.length < 3 && !uploading && (
            <p className="text-sm text-muted-foreground">
              Upload at least {3 - photos.length} more {photos.length === 2 ? 'photo' : 'photos'} to submit
            </p>
          )}
        </div>
      </form>

      {/* Onboarding Modal */}
      <Onboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
      </div>
    </div>
  );
};

export default Upload;
