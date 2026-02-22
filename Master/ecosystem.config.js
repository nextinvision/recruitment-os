module.exports = {
  apps: [
    {
      name: 'recruitment-os',
      script: 'npm',
      args: 'start',
      cwd: '/root/recruitment-os/Master',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/recruitment-os-error.log',
      out_file: '/var/log/pm2/recruitment-os-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'jobspy-scraper',
      script: '/root/recruitment-os/JobSpy-main/run_api.sh',
      interpreter: 'bash',
      cwd: '/root/recruitment-os/JobSpy-main',
      instances: 1,
      exec_mode: 'fork',
      error_file: '/var/log/pm2/jobspy-scraper-error.log',
      out_file: '/var/log/pm2/jobspy-scraper-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
}
