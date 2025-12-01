import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Camera, MessageSquare, BarChart3, ArrowRight } from 'lucide-react';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { motion } from 'framer-motion';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Note: Removed auto-redirect so logged-in users can view the landing page
  // They can navigate to dashboard via the nav button

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation - Positioned over hero */}
      <nav className="absolute top-0 left-0 right-0 z-20 container mx-auto px-4 py-4 flex justify-between items-center" aria-label="Main navigation">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-semibold text-lg">Profile Analyzer</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/about')} aria-label="About page">
            About
          </Button>
          {user ? (
            <Button onClick={() => navigate('/dashboard')} aria-label="Go to Dashboard">
              Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')} aria-label="Sign In">
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section with Animation */}
      <section className="relative" aria-label="Hero section">
        <HeroGeometric
          title1="Find Your Best Self"
          title2="on Dating Apps"
        />
        {/* CTA Buttons overlaid on hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            delay: 1.1,
            ease: [0.25, 0.4, 0.25, 1],
          }}
          className="absolute bottom-32 left-0 right-0 z-20 flex flex-col sm:flex-row gap-4 justify-center px-4"
          aria-label="Call to action buttons"
        >
          {user ? (
            <>
              <Button size="lg" onClick={() => navigate('/upload')} className="text-lg px-8 shadow-lg" aria-label="Upload Profile">
                Upload Your Profile
                <ArrowRight className="ml-2 w-5 h-5" aria-label="Arrow right icon" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')} className="shadow-lg bg-background/80 backdrop-blur-sm" aria-label="View Dashboard">
                View Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 shadow-lg" aria-label="Get Started Free">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" aria-label="Arrow right icon" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/about')} className="shadow-lg bg-background/80 backdrop-blur-sm" aria-label="Learn More">
                Learn More
              </Button>
            </>
          )}
        </motion.div>
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
