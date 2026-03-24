
import 'dotenv/config';
import express from 'express';

import { register, login, getProfile, updateProfile } from './function/auth';
import { authenticateToken } from './function/token';
import { 
  getMySurveys, createSurvey, publishSurvey, closeSurvey, deleteSurvey,
  getAllPublicSurveys, getSurveyById, getSurveyByName, submitVote,
  getSurveyStatus, updateSurvey, getSurveyResponses, exportSurveyResults,
  getSurveyAnalytics 
} from './function/survey';
import { 
  verifyAdmin, getAllSurveysAdmin, deleteSurveyAdmin, updateSurveyStatusAdmin 
} from './function/admin';
import{starts} from './function/starts'
const index = express();
index.use(express.json());

index.get('/',starts);

index.post('/api/auth/register', register);
index.post('/api/auth/login', login);
index.post('/api/auth/logout', (req, res) => res.json({ msg: "Token invalidated by client" }));
index.get('/api/profile', authenticateToken, getProfile);
index.patch('/api/profile', authenticateToken, updateProfile);

index.get('/api/surveys', authenticateToken, getAllPublicSurveys);
index.get('/api/surveys/:id', authenticateToken, getSurveyById);
index.get('/api/surveys/search/:name', authenticateToken, getSurveyByName);
index.post('/api/surveys/:id/submit', authenticateToken, submitVote);
index.get('/api/surveys/:id/status', authenticateToken, getSurveyStatus);

index.get('/api/surveys/my', authenticateToken, getMySurveys);
index.post('/api/surveys', authenticateToken, createSurvey);
index.patch('/api/surveys/:id', authenticateToken, updateSurvey);
index.post('/api/surveys/:id/publish', authenticateToken, publishSurvey);
index.post('/api/surveys/:id/close', authenticateToken, closeSurvey);
index.delete('/api/surveys/:id', authenticateToken, deleteSurvey);

index.get('/api/surveys/:id/analytics', authenticateToken, getSurveyAnalytics);
index.get('/api/surveys/:id/export', authenticateToken, exportSurveyResults);
index.get('/api/surveys/:id/responses', authenticateToken, getSurveyResponses);

index.get('/api/admin/surveys', authenticateToken, verifyAdmin, getAllSurveysAdmin);
index.delete('/api/admin/surveys/:id', authenticateToken, verifyAdmin, deleteSurveyAdmin);
index.patch('/api/admin/surveys/:id/status', authenticateToken, verifyAdmin, updateSurveyStatusAdmin);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  index.listen(PORT, () => {
    console.log(`запущен - http://localhost:3000`);
  });
}

export default index;