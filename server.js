const mysql = require('mysql2');

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Michiura12@',
  database: 'proagua',
});

console.log('Iniciando conexão...');

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('Conexão ao MySQL bem-sucedida!');
  db.end();
});
