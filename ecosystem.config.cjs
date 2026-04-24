module.exports = {
    apps: [
        {
            name: "be-pic-gwenza-api",
            script: "./src/main.js",
        },
        {
            name: "be-pic-gwenza-worker-upload-order",
            script: "./src/workers/upload-order/consumer.js",
        },
        {
            name: "be-pic-gwenza-worker-upload-cancel",
            script: "./src/workers/upload-cancel/consumer.js",
        },
        {
            name: "be-pic-gwenza-worker-upload-failed",
            script: "./src/workers/upload-failed/consumer.js",
        },
        {
            name: "be-pic-gwenza-worker-process-order",
            script: "./src/workers/process-order/consumer.js",
        },
        {
            name: "be-pic-gwenza-worker-process-cancel",
            script: "./src/workers/process-cancel/consumer.js",
        },
        {
            name: "be-pic-gwenza-worker-process-failed",
            script: "./src/workers/process-failed/consumer.js",
        }
    ]
};