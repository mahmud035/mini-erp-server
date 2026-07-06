import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { globalErrorHandler } from './middleware/globalErrorHandler';
import { notFound } from './middleware/notFound';
import router from './routes';
import { sendResponse } from './utils/sendResponse';

const app = express();

// Middleware order matters: CORS (with credentials for cookie auth) must run
// before body/cookie parsing so preflight and origin checks happen first.
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

// Health probe — the only route in this batch.
app.get('/api/health', (_req, res) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Server is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Feature routers.
app.use('/api', router);

// 404 then the global error handler — both must stay last, in this order.
app.use(notFound);
app.use(globalErrorHandler);

export default app;
