import dotenv from 'dotenv';

dotenv.config();

const config = {
    app_name: process.env.APP_NAME || 'ShortUrl-APP',
    port: process.env.PORT || 3000,
    db_uri:  process.env.DB_URI || 'mongodb://localhost:27017/short_url_db',
    elements: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    totalTrial: 10,
    cachePrefix: "redirect",
    urlLength: 8
}

export default config;