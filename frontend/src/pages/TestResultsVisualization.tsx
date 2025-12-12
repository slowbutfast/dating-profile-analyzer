import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Results from './Results';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

/**
 * Test Results Visualization Page
 * 
 * This page allows you to:
 * 1. Create a mock profile with LLM analysis data
 * 2. View existing profiles from the database
 */

function TestResultsContent() {
  const { profileId } = useParams<{ profileId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [creatingMockProfile, setCreatingMockProfile] = useState(false);

  // If profileId is provided, redirect to the standard profile-analysis route
  useEffect(() => {
    if (profileId && profileId !== '') {
      navigate(`/profile-analysis/${profileId}`, { replace: true });
    }
  }, [profileId, navigate]);

  // Otherwise show the creation interface
  const handleCreateMockProfile = async () => {
    setCreatingMockProfile(true);
    try {
      const response = await api.post('/mock-profile/create', {});
      const data = await response.json();
      const { analysisId, textFeedback } = data;
      
      // Store the text feedback in localStorage so Results can access it
      if (textFeedback) {
        localStorage.setItem(`mock_feedback_${analysisId}`, JSON.stringify(textFeedback));
      }
      
      toast({
        title: 'Mock Profile Created',
        description: 'Navigating to your new profile...',
      });

      // Navigate to the results page for this profile
      navigate(`/profile-analysis/${analysisId}`);
    } catch (error: any) {
      console.error('Error creating mock profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create mock profile',
        variant: 'destructive',
      });
    } finally {
      setCreatingMockProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-2xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Test Results Visualization</h1>
            <p className="text-muted-foreground">
              Create a mock profile to see how the analysis page displays with LLM data.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create Mock Profile</CardTitle>
              <CardDescription>
                Creates a realistic profile with text responses and LLM-generated analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Sample bio and profile text responses</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Realistic LLM analysis for each response</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Personality insights and suggestions</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Stored in database like real profiles</span>
                </div>
              </div>

              <Button 
                onClick={handleCreateMockProfile}
                disabled={creatingMockProfile}
                size="lg"
                className="w-full"
              >
                {creatingMockProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Mock Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">What This Does</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>
                Clicking "Create Mock Profile" will:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Create a sample profile in the database</li>
                <li>Add realistic text responses and bios</li>
                <li>Generate LLM analysis for each response</li>
                <li>Navigate you to the results page to see it rendered</li>
              </ol>
              <p className="pt-2">
                This lets you see exactly how the profile analysis page displays with real LLM data, without needing to upload photos or fill out the form manually.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TestResultsContent;
