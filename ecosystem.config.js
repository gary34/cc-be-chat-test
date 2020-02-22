module.exports = {
    apps: [{
        name: 'gateway',
        script: 'src/gateway.js',
        instances: 'max',
        exec_mode: 'cluster'
    }, {
        name: 'server',
        script: 'src/server.js',
        instances: 'max',
        exec_mode: "fork"
    }],
};
