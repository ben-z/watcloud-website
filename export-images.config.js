module.exports = {
    // needs to be in sync with next.config.js
    basePath: (process.env.WEBSITE_BASE_PATH || '').replace(/\/$/, ""),

    sharpOptions: {
        jpg: {
            progressive: true,
            optimizeScans: true,
        },
        png: {
            progressive: true,
        }
    },
}