import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Target, Zap, Shield, Users } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" aria-label="About page">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--gradient-mesh)' }} />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative" aria-label="About content">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
          aria-label="Go back to home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden />
          Back
        </Button>

        <div className="mb-12 text-center" aria-label="About header">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" aria-label="About title">About ProfileAI</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" aria-label="About description">
            Advanced AI-powered profile analysis to help you optimize your online presence
            and make better impressions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12" aria-label="Features grid">
          <Card aria-label="Our mission card">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4" aria-hidden>
                <Target className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <CardTitle aria-label="Our mission title">Our Mission</CardTitle>
              <CardDescription aria-label="Our mission description">
                We believe everyone deserves to present their best self online. Our AI analyzes
                your profile photos and bio to provide actionable insights that help you stand out.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card aria-label="How it works card">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4" aria-hidden>
                <Zap className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <CardTitle aria-label="How it works title">How It Works</CardTitle>
              <CardDescription aria-label="How it works description">
                Upload 3-10 photos and optionally add your bio and text responses. Our advanced
                AI analyzes composition, lighting, expressions, and content to give you detailed
                feedback and improvement suggestions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card aria-label="Privacy card">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4" aria-hidden>
                <Shield className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <CardTitle aria-label="Privacy title">Privacy & Security</CardTitle>
              <CardDescription aria-label="Privacy description">
                Your photos and data are stored securely and only accessible to you. We use
                enterprise-grade encryption and never share your information with third parties.
                You can delete your data anytime.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card aria-label="Audience card">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4" aria-hidden>
                <Users className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <CardTitle aria-label="Who it's for title">Who It's For</CardTitle>
              <CardDescription aria-label="Who it's for description">
                Whether you're optimizing dating profiles, professional headshots, or social media
                presence, ProfileAI provides personalized feedback to help you make the best
                impression possible.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20" aria-label="Get started card">
          <CardContent className="pt-6">
            <div className="text-center max-w-2xl mx-auto" aria-label="Get started content">
              <h2 className="text-2xl font-bold mb-4" aria-label="Ready title">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6" aria-label="Get started description">
                Join thousands of users who have improved their online profiles with AI-powered insights.
              </p>
              <div className="flex gap-4 justify-center" aria-label="Get started actions">
                <Button size="lg" onClick={() => navigate('/upload')} aria-label="Analyze your profile">
                  Analyze Your Profile
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')} aria-label="View dashboard">
                  View Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
