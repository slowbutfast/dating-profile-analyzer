import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Trash2, 
  Loader2,
  AlertTriangle,
  Edit3,
  LogOut
} from 'lucide-react';
import { db } from '@/integrations/firebase/config';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

const questions = [
  {
    id: 'age_range',
    question: 'What is your age range?',
    type: 'radio',
    options: ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'],
  },
  {
    id: 'gender',
    question: 'How do you identify?',
    type: 'radio',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'],
    allowOther: true,
  },
  {
    id: 'dating_goal',
    question: 'What are you looking for?',
    type: 'radio',
    options: ['Long-term relationship', 'Short-term dating', 'New friends', 'Not sure yet', 'Other'],
    allowOther: true,
  },
  {
    id: 'personality_type',
    question: 'How would you describe your personality?',
    type: 'radio',
    options: ['Outgoing and social', 'Reserved and thoughtful', 'Adventurous and spontaneous', 'Calm and steady', 'Creative and expressive', 'Other'],
    allowOther: true,
  },
  {
    id: 'conversation_style',
    question: 'Your conversation style:',
    type: 'radio',
    options: ['Deep and meaningful', 'Light and playful', 'Intellectual and curious', 'Funny and entertaining', 'Balanced mix', 'Other'],
    allowOther: true,
  },
  {
    id: 'humor_style',
    question: 'Your sense of humor:',
    type: 'radio',
    options: ['Witty and clever', 'Sarcastic', 'Silly and goofy', 'Dry humor', 'Not very humorous', 'Other'],
    allowOther: true,
  },
  {
    id: 'dating_experience',
    question: 'Your dating app experience:',
    type: 'radio',
    options: ['Very experienced', 'Somewhat experienced', 'New to dating apps', 'First time'],
  },
  {
    id: 'interests',
    question: 'What are your main interests? (List a few)',
    type: 'textarea',
    placeholder: 'e.g., hiking, reading, cooking, travel, music...',
  },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPersonalityData();
  }, [user]);

  const loadPersonalityData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const personalityRef = doc(db, 'user_personalities', user.uid);
      const personalitySnap = await getDoc(personalityRef);
      
      if (personalitySnap.exists()) {
        const data = personalitySnap.data();
        const loadedAnswers: Record<string, string> = {};
        const loadedOtherInputs: Record<string, string> = {};
        
        // Parse answers and check for "Other" responses
        questions.forEach(q => {
          if (data[q.id]) {
            const value = data[q.id];
            // Check if this is a custom answer (not in predefined options)
            if (q.allowOther && !q.options.includes(value)) {
              loadedAnswers[q.id] = 'Other';
              loadedOtherInputs[q.id] = value;
            } else {
              loadedAnswers[q.id] = value;
            }
          }
        });
        
        setAnswers(loadedAnswers);
        setOtherInputs(loadedOtherInputs);
      }
    } catch (error: any) {
      console.error('Error loading personality data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your profile data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
    // Clear other input if user selects a non-"Other" option
    if (value !== 'Other') {
      const newOtherInputs = { ...otherInputs };
      delete newOtherInputs[questionId];
      setOtherInputs(newOtherInputs);
    }
  };

  const handleOtherInput = (questionId: string, value: string) => {
    setOtherInputs({ ...otherInputs, [questionId]: value });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Merge answers with "Other" inputs
      const finalAnswers: Record<string, string> = {};
      questions.forEach(q => {
        if (answers[q.id]) {
          if (answers[q.id] === 'Other' && otherInputs[q.id]) {
            finalAnswers[q.id] = otherInputs[q.id];
          } else {
            finalAnswers[q.id] = answers[q.id];
          }
        }
      });

      // Save personality data to Firestore
      const personalityRef = doc(db, 'user_personalities', user.uid);
      await setDoc(personalityRef, {
        ...finalAnswers,
        user_id: user.uid,
        updated_at: serverTimestamp(),
      }, { merge: true });

      toast({
        title: 'Profile updated!',
        description: 'Your personality profile has been saved.',
      });
      
      setEditingQuestion(null);
    } catch (error: any) {
      console.error('Error saving personality data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      // Delete personality data
      const personalityRef = doc(db, 'user_personalities', user.uid);
      await deleteDoc(personalityRef);
      
      // Delete user profile
      const profileRef = doc(db, 'profiles', user.uid);
      await deleteDoc(profileRef);
      
      // Delete Firebase Auth account
      await deleteUser(user);
      
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. You may need to re-authenticate.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Personality Responses */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Personality Assessment</CardTitle>
            <CardDescription>
              Your answers help us personalize your text feedback. Click on any answer to edit it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => {
              const currentAnswer = answers[question.id];
              const isEditing = editingQuestion === question.id;
              
              return (
                <div key={question.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Label className="text-base font-semibold">{question.question}</Label>
                        {!isEditing && currentAnswer && (
                          <p className="text-muted-foreground mt-2">
                            {currentAnswer === 'Other' && otherInputs[question.id] 
                              ? otherInputs[question.id]
                              : currentAnswer || 'Not answered'}
                          </p>
                        )}
                        {!isEditing && !currentAnswer && (
                          <p className="text-muted-foreground mt-2 italic">Not answered</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingQuestion(isEditing ? null : question.id)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>

                    {isEditing && (
                      <div className="space-y-3 pl-4 border-l-2 border-primary/20 mt-4">
                        {question.type === 'radio' && (
                          <RadioGroup
                            value={currentAnswer || ''}
                            onValueChange={(value) => handleAnswer(question.id, value)}
                          >
                            <div className="space-y-2">
                              {question.options.map((option) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                                  <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}
                        
                        {question.type === 'textarea' && (
                          <Textarea
                            value={currentAnswer || ''}
                            onChange={(e) => handleAnswer(question.id, e.target.value)}
                            placeholder={question.placeholder}
                            className="min-h-[100px]"
                          />
                        )}

                        {/* Show "Other" input field if "Other" is selected */}
                        {question.allowOther && currentAnswer === 'Other' && (
                          <div className="space-y-2">
                            <Label htmlFor={`${question.id}-other-input`}>
                              Please specify:
                            </Label>
                            <Textarea
                              id={`${question.id}-other-input`}
                              value={otherInputs[question.id] || ''}
                              onChange={(e) => handleOtherInput(question.id, e.target.value)}
                              placeholder="Please specify..."
                              maxLength={200}
                              className="min-h-[80px]"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleSave} disabled={saving} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingQuestion(null)}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account,
              all your analyses, personality data, and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
