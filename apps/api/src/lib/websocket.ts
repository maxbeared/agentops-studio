import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './jwt';

interface Client {
  ws: WebSocket;
  userId?: string;
  subscriptions: Set<string>;
}

const clients = new Map<WebSocket, Client>();

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req) => {
    const client: Client = {
      ws,
      subscriptions: new Set(),
    };
    clients.set(ws, client);

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (token) {
      try {
        const payload = verifyToken(token) as { userId: string };
        client.userId = payload.userId;
      } catch {
        // Invalid token, anonymous client
      }
    }

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribe') {
          const runId = message.runId;
          if (runId) {
            client.subscriptions.add(runId);
          }
        }
        
        if (message.type === 'unsubscribe') {
          const runId = message.runId;
          if (runId) {
            client.subscriptions.delete(runId);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });

    ws.send(JSON.stringify({ type: 'connected', clientId: client.userId || 'anonymous' }));
  });

  return wss;
}

export function broadcastRunUpdate(runId: string, update: Record<string, any>) {
  const message = JSON.stringify({
    type: 'run_update',
    runId,
    ...update,
  });

  clients.forEach((client) => {
    if (client.subscriptions.has(runId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

export function broadcastReviewTask(taskId: string, update: Record<string, any>) {
  const message = JSON.stringify({
    type: 'review_update',
    taskId,
    ...update,
  });

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}
