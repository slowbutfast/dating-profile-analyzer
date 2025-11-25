import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import { db } from '@/integrations/firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface PersonalityData {
  age_range: string;
  gender: string;
  dating_goal: string;
  personality_type: string;
  interests: string;
  conversation_style: string;
  humor_style: string;
  values: string[];
  dating_experience: string;
  ideal_match: string;
}

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
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  },
  {
    id: 'dating_goal',
    question: 'What are you looking for?',
    type: 'radio',
    options: ['Long-term relationship', 'Short-term dating', 'New friends', 'Not sure yet'],
  },
  {
    id: 'personality_type',
    question: 'How would you describe your personality?',
    type: 'radio',
    options: ['Outgoing and social', 'Reserved and thoughtful', 'Adventurous and spontaneous', 'Calm and steady', 'Creative and expressive'],
  },
  {
    id: 'conversation_style',
    question: 'Your conversation style:',
    type: 'radio',
    options: ['Deep and meaningful', 'Light and playful', 'Intellectual and curious', 'Funny and entertaining', 'Balanced mix'],
  },
  {
    id: 'humor_style',
    question: 'Your sense of humor:',
    type: 'radio',
    options: ['Witty and clever', 'Sarcastic', 'Silly and goofy', 'Dry humor', 'Not very humorous'],
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
  {
    id: 'ideal_match',
    question: 'Describe your ideal match in a few words:',
    type: 'textarea',
    placeholder: 'What qualities are you looking for in a partner?',
  },
];

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const Onboarding = ({ open, onComplete, onSkip }: OnboardingProps) => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      toast({
        title: 'Answer required',
        description: 'Please answer the question before continuing.',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to continue.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Save personality data to Firestore
      const personalityRef = doc(db, 'user_personalities', user.uid);
      await setDoc(personalityRef, {
        ...answers,
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      toast({
        title: 'Profile complete!',
        description: 'Your personality profile has been saved.',
      });

      // Close modal and trigger completion callback
      onComplete();
    } catch (error: any) {
      console.error('Error saving personality data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClick = () => {
    setShowSkipWarning(true);
  };

  const confirmSkip = () => {
    setShowSkipWarning(false);
    onSkip();
  };

  // Reset to intro when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setShowIntro(true);
      setCurrentStep(0);
    } else if (!loading) {
      onSkip();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-label="Personality assessment">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <DialogTitle>
                {showIntro ? 'Personalize Your Analysis' : 'Tell us about yourself'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {showIntro 
                ? 'Get insights tailored specifically to your dating goals and personality'
                : 'Help us provide personalized insights by answering a few questions about your personality and dating goals.'
              }
            </DialogDescription>
          </DialogHeader>

          {showIntro ? (
            // Introduction Screen
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Why do we need this?</h3>
                <p className="text-muted-foreground">
                  Dating profiles work differently for everyone. What works for someone seeking a long-term relationship 
                  might not work for someone looking for casual dating. Your personality, conversation style, and goals 
                  all influence how others perceive your profile.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">What you'll get:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-sm font-semibold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Goal-Aligned Feedback</p>
                      <p className="text-sm text-muted-foreground">
                        Recommendations based on whether you're seeking long-term love, casual dating, or new friends
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-sm font-semibold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Personality-Matched Advice</p>
                      <p className="text-sm text-muted-foreground">
                        Tips that work for your unique style - whether you're outgoing, reserved, or somewhere in between
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-sm font-semibold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Context-Aware Insights</p>
                      <p className="text-sm text-muted-foreground">
                        Analysis considers your experience level and what you're looking for in a match
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>⏱️ Takes less than 2 minutes</strong> • 9 quick questions
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handleSkipClick}
                  disabled={loading}
                  aria-label="Skip personality assessment"
                >
                  Skip for now
                </Button>

                <Button
                  onClick={() => setShowIntro(false)}
                  aria-label="Start personality assessment"
                  size="lg"
                >
                  Start Assessment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            // Questions Screen
            <div className="space-y-6">
              <div className="space-y-2">
                <Progress value={progress} className="h-2" aria-label={`Progress: ${Math.round(progress)}%`} />
                <p className="text-sm text-muted-foreground">
                  Question {currentStep + 1} of {questions.length}
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold" aria-label={`Question ${currentStep + 1}`}>
                  {currentQuestion.question}
                </Label>

                {currentQuestion.type === 'radio' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={handleAnswer}
                    aria-label={currentQuestion.question}
                  >
                    {currentQuestion.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="cursor-pointer font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'textarea' && (
                  <Textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    rows={4}
                    maxLength={500}
                    aria-label={currentQuestion.question}
                  />
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  aria-label="Previous question"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSkipClick}
                  disabled={loading}
                  aria-label="Skip personality assessment"
                >
                  Skip for now
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={loading || !answers[currentQuestion.id]}
                  aria-label={currentStep === questions.length - 1 ? "Submit answers" : "Next question"}
                >
                  {loading ? 'Saving...' : currentStep === questions.length - 1 ? 'Complete' : 'Next'}
                  {!loading && currentStep < questions.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Skip Warning Dialog */}
      <AlertDialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <AlertDialogTitle>Skip Personality Assessment?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong className="text-foreground">Warning:</strong> Without your personality profile, our analysis will be more generic and may not fully match your dating goals and preferences.
              </p>
              <p className="text-sm">
                Personalized insights help us tailor recommendations specifically to:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                <li>Your relationship goals (long-term, casual, friends)</li>
                <li>Your personality type and conversation style</li>
                <li>What you're looking for in a match</li>
                <li>Your experience level with dating apps</li>
              </ul>
              <p className="text-sm font-medium text-foreground">
                This takes less than 2 minutes and significantly improves your results.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={confirmSkip}
              className="bg-transparent hover:bg-muted"
            >
              Skip Anyway
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setShowSkipWarning(false)}
              className="bg-primary hover:bg-primary/90"
            >
              Continue Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Onboarding;
