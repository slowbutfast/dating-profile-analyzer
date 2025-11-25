import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Upload, History, LogOut, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Analysis {
  id: string;
  status: string;
  created_at: any;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyses();
  }, [user]);

  const loadAnalyses = async () => {
    if (!user) return;
    
    try {
      const result = await api.getUserAnalyses(user.uid);
      setAnalyses(result.analyses);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load your analyses',
        variant: 'destructive',
      });
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    navigate('/upload');
  };

  const handleViewAnalysis = (id: string) => {
    navigate(`/results/${id}`);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" aria-label="Dashboard page">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-mesh)' }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10" role="banner" aria-label="Header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden>
              <Heart className="w-5 h-5 text-primary fill-primary" aria-hidden />
            </div>
            <span className="text-xl font-bold" aria-label="App name">Profile Analyzer</span>
          </div>
          <Button variant="ghost" onClick={signOut} aria-label="Sign out">
            <LogOut className="w-4 h-4 mr-2" aria-hidden />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" aria-label="Dashboard title">Dashboard</h1>
          <p className="text-muted-foreground" aria-label="Dashboard greeting">
            Welcome back, {user?.displayName || user?.email}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8" aria-label="Quick actions">
          <Card className="hover:border-primary/40 transition-all cursor-pointer" onClick={handleNewAnalysis} aria-label="New analysis card">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4" aria-hidden>
                <Plus className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <CardTitle aria-label="New analysis title">New Analysis</CardTitle>
              <CardDescription aria-label="New analysis description">Upload and analyze a new dating profile</CardDescription>
            </CardHeader>
          </Card>

          <Card aria-label="Total analyses card">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4" aria-hidden>
                <Upload className="w-6 h-6 text-accent" aria-hidden />
              </div>
              <CardTitle aria-label="Total analyses title">{analyses.length}</CardTitle>
              <CardDescription aria-label="Total analyses description">Total Analyses</CardDescription>
            </CardHeader>
          </Card>

          <Card aria-label="Completed card">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4" aria-hidden>
                <History className="w-6 h-6 text-secondary-foreground" aria-hidden />
              </div>
              <CardTitle aria-label="Completed title">{analyses.filter(a => a.status === 'completed').length}</CardTitle>
              <CardDescription aria-label="Completed description">Completed</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Analyses */}
        <Card aria-label="Recent analyses card">
          <CardHeader>
            <CardTitle aria-label="Recent analyses title">Recent Analyses</CardTitle>
            <CardDescription aria-label="Recent analyses description">View and manage your profile analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8" aria-label="Loading analyses">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" aria-hidden></div>
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-12" aria-label="No analyses">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden />
                <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
                <p className="text-muted-foreground mb-4" aria-label="No analyses description">Get started by uploading your first dating profile for analysis</p>
                <Button onClick={handleNewAnalysis} aria-label="Create first analysis">
                  <Plus className="w-4 h-4 mr-2" aria-hidden />
                  Create First Analysis
                </Button>
              </div>
            ) : (
              <div className="space-y-4" aria-label="Analyses list">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => handleViewAnalysis(analysis.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open analysis ${analysis.id}`}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleViewAnalysis(analysis.id) }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden>
                        <Heart className="w-5 h-5 text-primary" aria-hidden />
                      </div>
                      <div>
                        <p className="font-medium">Analysis {analysis.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(analysis.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`} aria-label={`Status ${analysis.status}`}>
                        {analysis.status}
                      </span>
                      <Button variant="ghost" size="sm" aria-label={`View results for ${analysis.id}`}>
                        View Results
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
