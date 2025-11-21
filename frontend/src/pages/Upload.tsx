import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
  const navigate = useNavigate();
  const { toast } = useToast();

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

      // Upload to backend API
      const result = await api.upload(user.uid, photos, bio.trim(), filteredResponses);

      toast({
        title: 'Upload successful!',
        description: 'Your profile is being analyzed. This may take a few minutes.',
      });

      navigate(`/results/${result.analysisId}`);
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
    <div className="container max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Your Profile</h1>
        <p className="text-muted-foreground">
          Upload your dating profile photos, bio, and optional text responses to get an AI-powered analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photos</CardTitle>
            <CardDescription>
              Upload 1-10 photos from your dating profile. Accepted formats: JPG, PNG, WebP (max 10MB each)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
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
                  >
                    ×
                  </Button>
                </div>
              ))}
              
              {photos.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
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
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bio</CardTitle>
            <CardDescription>
              Paste your dating profile bio or description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your bio here..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

        {/* Text Responses Section */}
        <Card>
          <CardHeader>
            <CardTitle>Text Responses (Optional)</CardTitle>
            <CardDescription>
              Add prompt questions and your responses from your profile (e.g., "What I'm looking for", "My perfect Sunday")
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {textResponses.map((response, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <Label>Response {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTextResponse(index)}
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Question/Prompt"
                  value={response.question}
                  onChange={(e) => updateTextResponse(index, 'question', e.target.value)}
                />
                <Textarea
                  placeholder="Your answer"
                  value={response.answer}
                  onChange={(e) => updateTextResponse(index, 'answer', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            ))}
            
            {textResponses.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={addTextResponse}
                className="w-full"
              >
                + Add Text Response
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={uploading} size="lg">
            {uploading ? 'Uploading...' : 'Analyze My Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Upload;
