import { Hono } from 'hono';
import { db } from '@agentops/db';
import { workflowRuns, workflows, workflowVersions, reviewTasks } from '@agentops/db/schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { getAuthUser } from '../lib/auth';

export const dashboardRoutes = new Hono();

dashboardRoutes.get('/stats', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

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

  const pendingReviewsResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(reviewTasks)
    .where(eq(reviewTasks.status, 'pending'));
  const pendingReviewsCount = pendingReviewsResult[0]?.count || 0;

  // Batch fetch versions and workflows for recent runs
  const recentRunVersionIds = allRuns.slice(0, 5).map((r) => r.workflowVersionId).filter(Boolean);
  const versionsMap = new Map<string, typeof workflowVersions.$inferSelect>();
  const workflowsMap = new Map<string, typeof workflows.$inferSelect>();

  if (recentRunVersionIds.length > 0) {
    const versions = await db.query.workflowVersions.findMany({
      where: inArray(workflowVersions.id, recentRunVersionIds),
    });
    versions.forEach((v) => versionsMap.set(v.id, v));

    const workflowIds = [...new Set(versions.map((v) => v.workflowId).filter(Boolean))];
    if (workflowIds.length > 0) {
      const workflowsResult = await db.query.workflows.findMany({
        where: inArray(workflows.id, workflowIds),
      });
      workflowsResult.forEach((w) => workflowsMap.set(w.id, w));
    }
  }

  const recentRuns = allRuns.slice(0, 5).map((run) => {
    const version = versionsMap.get(run.workflowVersionId);
    const workflow = version ? workflowsMap.get(version.workflowId) : null;
    return {
      id: run.id,
      workflowName: workflow?.name || 'Unknown Workflow',
      status: run.status,
      createdAt: run.createdAt,
    };
  });

  return c.json({
    data: {
      totalRuns,
      successRate,
      totalTokens,
      totalCost: Math.round(totalCost * 100) / 100,
      pendingReviews: pendingReviewsCount,
      recentRuns,
    },
  });
});