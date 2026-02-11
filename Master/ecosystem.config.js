module.exports = {
  apps: [{
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
  }]
}
