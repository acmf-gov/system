module.exports = {
  apps: [{
    name: 'barca-coletiva',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/barca-coletiva',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/barca-coletiva-error.log',
    out_file: '/var/log/pm2/barca-coletiva-out.log',
    log_file: '/var/log/pm2/barca-coletiva-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    merge_logs: true,
    source_map_support: true,
    node_args: '--max-old-space-size=1024'
  }]
};