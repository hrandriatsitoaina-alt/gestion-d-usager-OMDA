module.exports = {
    PORT: 3001,
    ADMIN_SECRET_TOKEN: 'super_admin_secret_2026',
    DAF_SECRET_TOKEN: 'daf_secret_token_2026',
    CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:5173'],
    CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    CORS_HEADERS: ['Content-Type', 'adminToken', 'Authorization']
  };