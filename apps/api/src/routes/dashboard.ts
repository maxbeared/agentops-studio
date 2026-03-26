import { Hono } from 'hono';

export const dashboardRoutes = new Hono();

dashboardRoutes.get('/stats', async (c) => {
  return c.json({
    data: {
      totalRuns: 128,
      successRate: 94.5,
      totalTokens: 163840,
      totalCost: 18.24,
      pendingReviews: 6,
      recentRuns: [
        {
          id: 'run-1',
          workflowName: 'Weekly Report',
          status: 'success',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'run-2',
          workflowName: 'Content Generator',
          status: 'success',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  });
});
