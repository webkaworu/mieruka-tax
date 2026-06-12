import { hc } from 'hono/client';
import type { AppType } from '@mieruka-tax/api-contract';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const client = hc<AppType>(API_URL);
