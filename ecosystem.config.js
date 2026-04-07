module.exports = {
  apps: [
    {
      name: 'agentops-api',
      script: 'bun',
      args: 'run src/index.ts',
      cwd: 'apps/api',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      watch: false,
      restart_delay: 4000,
      max_memory_restart: '512M',
    },
    {
      name: 'agentops-websocket',
      script: 'bun',
      args: 'run src/websocket-server.ts',
      cwd: 'apps/api',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3002,
      },
      watch: false,
      restart_delay: 4000,
      max_memory_restart: '256M',
    },
    {
      name: 'agentops-worker',
      script: 'bun',
      args: 'run src/index.ts',
      cwd: 'apps/worker',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      restart_delay: 4000,
      max_memory_restart: '512M',
    },
  ],
};
