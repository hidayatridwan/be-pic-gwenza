module.exports = {
    apps: [
        {
            name: "api",
            script: "./src/main.js",
        },
        {
            name: "worker-upload-order",
            script: "./src/workers/upload-order/consumer.js",
        },
        {
            name: "worker-upload-cancel",
            script: "./src/workers/upload-cancel/consumer.js",
        },
        {
            name: "worker-process-order",
            script: "./src/workers/process-order/consumer.js",
        },
        {
            name: "worker-process-cancel",
            script: "./src/workers/process-cancel/consumer.js",
        }
    ]
};