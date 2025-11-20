import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  // Remove all supabase references and related logic
  // Demo state
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

      toast({
        title: 'Upload successful!',
        description: 'Your profile is being analyzed. This may take a few minutes.',
      });

      navigate(`/results/demo`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
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

  // Remove Supabase logic, show demo upload page
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Demo Upload</h1>
        <p className="text-muted-foreground">Supabase is disabled. This is a demo view.</p>
      </div>
    </div>
  );
};

export default Upload;
