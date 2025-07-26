module.exports = {
    apps : [{
        name      : "HSL-core",
        script    : "build/src/server.js",
        max_memory_restart: "150M",
        exec_mode: "fork",
        instances: 1,
        time: true,
        listen_timeout: 8000,
        log_date_format: "DD-MM-YYYY HH:mm Z",
        // cron_restart: "0 0 12 * * ?",
    }]
}
