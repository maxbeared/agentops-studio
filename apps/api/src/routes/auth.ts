import { Hono } from 'hono';

export const authRoutes = new Hono();

authRoutes.post('/register', async (c) => {
  const body = await c.req.json();

  return c.json({
    message: 'Register endpoint placeholder',
    data: body,
  });
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();

  return c.json({
    message: 'Login endpoint placeholder',
    data: body,
  });
});
