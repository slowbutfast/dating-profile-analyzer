import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Camera, MessageSquare, BarChart3, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-4 flex justify-end" aria-label="Main navigation">
        <Button variant="ghost" onClick={() => navigate('/about')} aria-label="About page">
          About
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center" aria-label="Hero section">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6" aria-label="App logo">
            <Heart className="w-10 h-10 text-primary fill-primary" aria-label="Heart icon" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-light to-primary-dark bg-clip-text text-transparent" aria-label="App title">
            Dating Profile Analyzer
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" aria-label="App description">
            Upload your dating profile photos and prompts to receive data-driven insights and 
            actionable feedback to improve your matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center" aria-label="Call to action buttons">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8" aria-label="Get Started Free">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" aria-label="Arrow right icon" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} aria-label="Sign In">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16" aria-label="Features section">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-primary/40 transition-all" aria-label="Photo Analysis feature">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4" aria-label="Camera icon">
                <Camera className="w-6 h-6 text-primary" aria-label="Camera icon" />
              </div>
              <CardTitle aria-label="Photo Analysis title">Photo Analysis</CardTitle>
              <CardDescription aria-label="Photo Analysis description">
                Computer vision evaluates lighting, composition, framing, and eye contact in your photos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/40 transition-all" aria-label="Text Analysis feature">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4" aria-label="Message icon">
                <MessageSquare className="w-6 h-6 text-accent" aria-label="MessageSquare icon" />
              </div>
              <CardTitle aria-label="Text Analysis title">Text Analysis</CardTitle>
              <CardDescription aria-label="Text Analysis description">
                AI evaluates your prompt responses for warmth, humor, clarity, and conversation potential
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/40 transition-all" aria-label="Actionable Insights feature">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4" aria-label="Bar chart icon">
                <BarChart3 className="w-6 h-6 text-secondary-foreground" aria-label="BarChart3 icon" />
              </div>
              <CardTitle aria-label="Actionable Insights title">Actionable Insights</CardTitle>
              <CardDescription aria-label="Actionable Insights description">
                Get specific, metric-based feedback and improvement suggestions for every element
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16" aria-label="How It Works section">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" aria-label="How It Works title">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start" aria-label="Step 1">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0" aria-label="Step 1 number">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" aria-label="Step 1 title">Upload Your Profile</h3>
                <p className="text-muted-foreground" aria-label="Step 1 description">
                  Add 3-10 photos and at least one text response from your dating profile
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start" aria-label="Step 2">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0" aria-label="Step 2 number">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" aria-label="Step 2 title">AI Analysis</h3>
                <p className="text-muted-foreground" aria-label="Step 2 description">
                  Our AI analyzes your content using computer vision and natural language processing
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start" aria-label="Step 3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0" aria-label="Step 3 number">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" aria-label="Step 3 title">Get Results</h3>
                <p className="text-muted-foreground" aria-label="Step 3 description">
                  Receive detailed metrics, insights, and specific suggestions to improve your profile
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20" aria-label="Call to action section">
        <Card className="max-w-3xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" aria-label="CTA card">
          <CardContent className="pt-12 pb-12 text-center">
            <h2 className="text-3xl font-bold mb-4" aria-label="CTA title">Ready to Improve Your Profile?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto" aria-label="CTA description">
              Join others who are using data-driven insights to create better dating profiles
            </p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8" aria-label="Start Your Free Analysis">
              Start Your Free Analysis
              <ArrowRight className="ml-2 w-5 h-5" aria-label="Arrow right icon" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
