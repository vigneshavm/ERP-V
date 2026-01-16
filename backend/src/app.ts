import express, { Application } from 'express';
import cors from 'cors';
import categoryRoutes from './routes/category.routes.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Routes mounted under /api/v1 as per Master Specification
app.use('/api/v1/categories', categoryRoutes);

// Legacy/Compatibility Route (optional, but good to keep if frontend used /api/categories)
// app.use('/api/categories', categoryRoutes); 

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
