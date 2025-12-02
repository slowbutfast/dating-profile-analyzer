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
import { ArrowLeft, Upload as UploadIcon, X, Image as ImageIcon } from 'lucide-react';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const uploadSchema = z.object({
  photos: z.array(z.any()).min(3, 'Upload at least 3 photos').max(10, 'Maximum 10 photos'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  textResponses: z.array(z.object({
    question: z.string().trim().min(1, 'Question cannot be empty').max(200),
    answer: z.string().trim().min(1, 'Answer cannot be empty').max(1000),
  })).optional(),
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

    if (photos.length + validFiles.length > 10) {
      toast({
        title: 'Too many photos',
        description: 'Maximum 10 photos allowed',
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
      const result = await api.upload(user.uid, photos, bio.trim(), filteredResponses);

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

      navigate(`/results/${result.analysisId}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again',
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
      const filteredResponses = textResponses.filter(tr => tr.question.trim() || tr.answer.trim());
      await performUpload(filteredResponses);
    }
  };

  const handleOnboardingSkip = async () => {
    setShowOnboarding(false);
    
    if (pendingUpload) {
      const filteredResponses = textResponses.filter(tr => tr.question.trim() || tr.answer.trim());
      await performUpload(filteredResponses);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);

    try {
      // Validate input
      const filteredResponses = textResponses.filter(tr => tr.question.trim() || tr.answer.trim());
      uploadSchema.parse({
        photos,
        bio,
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
    <div className="container max-w-4xl mx-auto py-10" aria-label="Upload profile page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" aria-label="Upload title">Upload Your Profile</h1>
        <p className="text-muted-foreground" aria-label="Upload description">
          Upload your dating profile photos, bio, and optional text responses to get an AI-powered analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" aria-label="Upload form">
        {/* Photo Upload Section */}
        <Card aria-label="Profile photos card">
          <CardHeader>
            <CardTitle aria-label="Profile photos title">Profile Photos</CardTitle>
            <CardDescription aria-label="Profile photos description">
              Upload 3-10 photos from your dating profile. Accepted formats: JPG, PNG, WebP (max 10MB each)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-label="Uploaded photos grid">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border" aria-label={`Uploaded photo ${index + 1}`}>
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removePhoto(index)}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    ×
                  </Button>
                </div>
              ))}
              
              {photos.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors" aria-label="Add photo">
                  <div className="text-center">
                    <span className="text-4xl">+</span>
                    <p className="text-sm text-muted-foreground mt-2">Add Photo</p>
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
        <Card aria-label="Bio card">
          <CardHeader>
            <CardTitle aria-label="Bio title">Bio</CardTitle>
            <CardDescription aria-label="Bio description">
              Paste your dating profile bio or description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your bio here..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[200px]"
              aria-label="Profile bio textarea"
            />
          </CardContent>
        </Card>

        {/* Text Responses Section */}
        <Card aria-label="Text responses card">
          <CardHeader>
            <CardTitle aria-label="Text responses title">Text Responses (Optional)</CardTitle>
            <CardDescription aria-label="Text responses description">
              Add prompt questions and your responses from your profile (e.g., "What I'm looking for", "My perfect Sunday")
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
        <div className="flex justify-end" aria-label="Submit area">
          <Button type="submit" disabled={uploading} size="lg" aria-label="Analyze my profile">
            {uploading ? 'Uploading...' : 'Analyze My Profile'}
          </Button>
        </div>
      </form>

      {/* Onboarding Modal */}
      <Onboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </div>
  );
};

export default Upload;
