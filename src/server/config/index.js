// server/config.js
require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_SECRET_TOKEN: process.env.ADMIN_SECRET_TOKEN,
    DAF_SECRET_TOKEN: process.env.DAF_SECRET_TOKEN,
    CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:5173'],
    CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    CORS_HEADERS: ['Content-Type', 'adminToken', 'Authorization']
};