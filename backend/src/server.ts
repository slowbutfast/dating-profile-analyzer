import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Mock analysisRoutes to avoid import errors
const analysisRoutes = express.Router();
analysisRoutes.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Mock analysis route' });
});
import uploadRoutes from './routes/upload';
import imageAnalysisRoutes from './routes/imageAnalysis';
import { verifyAuth } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081'
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
// Public routes (no auth required)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Protected routes (auth required)
app.use('/api/analyses', verifyAuth, analysisRoutes);
app.use('/api/upload', verifyAuth, uploadRoutes);
app.use('/api/image-analysis', verifyAuth, imageAnalysisRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

export default app;
