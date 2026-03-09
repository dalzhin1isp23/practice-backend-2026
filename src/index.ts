import 'dotenv/config';
import express from 'express';
import { register, login ,getProfile ,updateProfile} from './function/auth.ts';
import { authenticateToken } from './function/token.ts';
import { getMySurveys, createSurvey, publishSurvey, closeSurvey, deleteSurvey,getAllPublicSurveys, getSurveyById, getSurveyByName , submitVote ,getSurveyStatus, updateSurvey} from './function/survey';
const app = express();
app.use(express.json());


app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', (req, res) => res.json({ msg: "Token invalidated by client" }));


app.get('/api/profile', authenticateToken, getProfile);
app.patch('/api/profile', authenticateToken, updateProfile);


app.get('/api/surveys', authenticateToken, getAllPublicSurveys);
app.get('/api/surveys/:id', authenticateToken, getSurveyById);
app.get('/api/surveys/search/:name', authenticateToken, getSurveyByName);
app.post('/api/surveys/:id/submit', authenticateToken, submitVote);
app.get('/api/surveys/:id/status', authenticateToken, getSurveyStatus);


app.get('/api/surveys/my', authenticateToken, getMySurveys);
app.post('/api/surveys', authenticateToken, createSurvey);
app.patch('/api/surveys/:id', authenticateToken, updateSurvey);
app.post('/api/surveys/:id/publish', authenticateToken, publishSurvey);
app.post('/api/surveys/:id/close', authenticateToken, closeSurvey);
app.delete('/api/surveys/:id', authenticateToken, deleteSurvey);


app.listen(3000, () => console.log('Сервер запущен на порту 3000'));