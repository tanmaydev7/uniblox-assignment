import express, { Request, Response } from 'express';
import dotenv from "dotenv";
import storeRouter from './routes/client-aka-store/index';
import adminRouter from './routes/admin/index';
import { errorHandler } from './utils/errorUtils';
import cors from "cors"
import bodyParser from "body-parser";

dotenv.config({
  path: '../.env'
}); // Load environment variables

const app = express();
const port = process.env.PORT || 8000;

export const DATABASE_URL = process.env.DATABASE_URL

app.use(cors({
  origin: "*"
}))


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));



app.use(
  '/api/v1/store',
  storeRouter
)

app.use(
  '/api/v1/admin',
  adminRouter
)

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});

app.use(
  errorHandler
)

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// Export app for testing
export default app;