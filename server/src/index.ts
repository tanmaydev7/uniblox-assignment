import express, { Request, Response } from 'express';
import dotenv from "dotenv";
import storeRouter from './routes/client-aka-store/index';
import { errorHandler } from './utils/errorUtils';

dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 8000;

export const DATABASE_URL = process.env.DATABASE_URL


app.use(
  '/api/v1/store',
  storeRouter
)

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});

app.use(
  errorHandler
)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});