const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('🚤 Barca Coletiva - Servidor funcionando!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando!' });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});