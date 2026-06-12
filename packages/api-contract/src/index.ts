import { Hono } from 'hono';
import { 
  ExpenditureSummary, 
  Organization, 
  ConversionUnit 
} from '@mieruka-tax/shared';

/**
 * API Contract Definition
 * 
 * This file defines the "shape" of our API. 
 * Both frontend and backend depend on this, but the implementation lives only in the backend.
 */

// Define the route types
const routes = new Hono()
  .get('/expenditures', (c) => {
    return c.json([] as ExpenditureSummary[]);
  })
  .get('/expenditures/:categoryId/timeseries', (c) => {
    return c.json([] as any[]);
  })
  .get('/conversion-units', (c) => {
    return c.json([] as ConversionUnit[]);
  })
  .get('/organizations', (c) => {
    return c.json([] as Organization[]);
  })
  .get('/organizations/:lgCode', (c) => {
    return c.json({} as Organization);
  })
  .get('/years', (c) => {
    return c.json([] as number[]);
  });

// The type that the frontend RPC client will use
export type AppType = typeof routes;

// Export shared types for convenience
export * from '@mieruka-tax/shared';
