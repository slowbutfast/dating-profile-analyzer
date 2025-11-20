import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Upload, History, LogOut, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Analysis {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // No auth, just set loading to false
    // If you want to show demo data, set it here
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Demo dashboard content
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Demo Dashboard</h1>
        <p className="text-muted-foreground">Supabase is disabled. This is a demo view.</p>
      </div>
    </div>
  );
};

export default Dashboard;
