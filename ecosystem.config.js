module.exports = {
  apps: [
    {
      name: 'fastapi-app',
      script: './start_fastapi.sh',
      cwd: '/home/ialuser/KB1/project',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/home/ialuser/.pm2/logs/fastapi-app-error.log',
      out_file: '/home/ialuser/.pm2/logs/fastapi-app-out.log',
      log_file: '/home/ialuser/.pm2/logs/fastapi-app-combined.log',
      time: true,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
