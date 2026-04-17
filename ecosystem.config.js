module.exports = {
  apps: [
    {
      name: 'vai-calcio',
      cwd: '/var/www/vai-calcio',
      script: 'node_modules/.bin/astro',
      args: 'dev --host 0.0.0.0 --port 5432',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
