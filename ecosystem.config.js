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
    error_file: '/var/log/pm2/barca-error.log',
    out_file: '/var/log/pm2/barca-out.log',
    log_file: '/var/log/pm2/barca-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // Configurações de reinicialização
    max_restarts: 10,
    min_uptime: '10s',
    // Configurações de monitoramento
    merge_logs: true,
    source_map_support: true,
    // Configurações de ambiente
    node_args: '--max-old-space-size=1024'
  }]
};