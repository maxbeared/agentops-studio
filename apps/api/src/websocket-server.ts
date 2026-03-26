import { createServer } from 'http';
import { setupWebSocket } from './lib/websocket';

const PORT = Number(process.env.WS_PORT || 3002);

const server = createServer();
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
