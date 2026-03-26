import { Hono } from 'hono';
import { db } from '@agentops/db';
import { workflowRuns, workflows, workflowVersions, reviewTasks } from '@agentops/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const dashboardRoutes = new Hono();

dashboardRoutes.get('/stats', async (c) => {
  const projectId = c.req.query('projectId');

  let runsWhere = undefined;
  if (projectId) {
    runsWhere = eq(workflowRuns.projectId, projectId);
  }

  const allRuns = await db.query.workflowRuns.findMany({
    where: runsWhere,
    orderBy: [desc(workflowRuns.createdAt)],
    limit: 50,
  });

  const totalRuns = allRuns.length;
  const successRuns = allRuns.filter((r) => r.status === 'success').length;
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 1000) / 10 : 0;

  const totalTokens = allRuns.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
  const totalCostResult = await db
    .select({ sum: sql<string | null>`SUM(${workflowRuns.totalCost})` })
    .from(workflowRuns)
    .where(runsWhere);
  const totalCost = totalCostResult[0]?.sum ? parseFloat(totalCostResult[0].sum) : 0;

  const pendingReviews = await db.query.reviewTasks.findMany({
    where: eq(reviewTasks.status, 'pending'),
  });

  const recentRuns = await Promise.all(
    allRuns.slice(0, 5).map(async (run) => {
      const version = await db.query.workflowVersions.findFirst({
        where: eq(workflowVersions.id, run.workflowVersionId),
      });
      const workflow = version
        ? await db.query.workflows.findFirst({
            where: eq(workflows.id, version.workflowId),
          })
        : null;
      return {
        id: run.id,
        workflowName: workflow?.name || 'Unknown Workflow',
        status: run.status,
        createdAt: run.createdAt,
      };
    })
  );

  return c.json({
    data: {
      totalRuns,
      successRate,
      totalTokens,
      totalCost: Math.round(totalCost * 100) / 100,
      pendingReviews: pendingReviews.length,
      recentRuns,
    },
  });
});