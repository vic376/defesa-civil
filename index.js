const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

const dbConfig = {
  host: process.env.MYSQLHOST || 'gondola.proxy.rlwy.net',
  port: process.env.MYSQLPORT || 45054,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'OhkkaKmamkyFPAfZvXvBHyhOryoQkEab',
  database: process.env.MYSQLDATABASE || 'railway'
};

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'Defesa Civil API online ✅', rotas: ['/leituras', '/alertas', '/resumo'] });
});

app.get('/leituras', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT id, CAST(temperatura AS DECIMAL(10,2)) as temperatura, CAST(umidade AS DECIMAL(10,2)) as umidade, alerta, criado_em FROM leituras_estufa ORDER BY criado_em DESC LIMIT 500');
    await conn.end();
    res.json(rows.map(r => ({
      id: Number(r.id),
      temperatura: Number(r.temperatura),
      umidade: Number(r.umidade),
      alerta: Number(r.alerta),
      criado_em: r.criado_em
    })));
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get('/alertas', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM alertas_estufa ORDER BY criado_em DESC LIMIT 200');
await conn.end();
const resultado = rows.map(r => ({
  ...r,
  temperatura: parseFloat(r.temperatura)
}));
res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get('/resumo', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [[stats]] = await conn.execute(`
      SELECT 
        COUNT(*) as total_leituras,
        ROUND(AVG(CAST(temperatura AS DECIMAL(10,2))), 2) as temp_media,
        ROUND(MAX(CAST(temperatura AS DECIMAL(10,2))), 2) as temp_maxima,
        ROUND(MIN(CAST(temperatura AS DECIMAL(10,2))), 2) as temp_minima,
        ROUND(AVG(CAST(umidade AS DECIMAL(10,2))), 2) as umidade_media,
        SUM(alerta) as total_alertas
      FROM leituras_estufa
    `);
    await conn.end();
    res.json({
      total_leituras: Number(stats.total_leituras),
      temp_media: Number(stats.temp_media),
      temp_maxima: Number(stats.temp_maxima),
      temp_minima: Number(stats.temp_minima),
      umidade_media: Number(stats.umidade_media),
      total_alertas: Number(stats.total_alertas)
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
