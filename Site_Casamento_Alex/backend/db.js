const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Hospedagens como Render/Railway/Supabase/Neon
    // normalmente exigem SSL. Configure DB_SSL=true
    // no .env quando estiver em produção.
    ssl:
    process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : false
});

async function conectar() {
    return pool;
}

module.exports = {
    conectar,
    pool
};