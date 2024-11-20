const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs'); // Para excluir o arquivo após enviar o e-mai

const app = express();

// Configuração do MySQL
const db = mysql.createConnection({
  host: '127.0.0.1', // Usando o IP local
  user: 'root',
  password: 'Michiura12@',
  database: 'proagua',
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL');
});

// Configuração do multer para o upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Pasta onde os arquivos serão salvos temporariamente
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único para cada arquivo
  }
});

const upload = multer({ storage: storage }).single('arquivo'); // 'arquivo' é o nome do campo no formulário

// Middleware para processar os dados do formulário
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Rota para enviar a denúncia com arquivo
app.post('/enviar_denuncia', upload, (req, res) => {
  const { email, Tipo_denuncia, descricao } = req.body;

  // Verificar se o arquivo foi enviado
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Por favor, envie uma imagem ou vídeo.' });
  }

  // Verificar se o e-mail existe na tabela de usuários
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.log('Erro ao acessar o banco de dados:', err);
      return res.status(500).json({ success: false, message: 'Erro ao acessar o banco de dados.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    // Inserir a denúncia no banco de dados
    db.query('INSERT INTO denuncias (email_usuario, tipo_denuncia, descricao, arquivo_path) VALUES (?, ?, ?, ?)', 
    [email, Tipo_denuncia, descricao, req.file.path], (err, result) => {
      if (err) {
        console.log('Erro ao registrar a denúncia:', err);
        return res.status(500).json({ success: false, message: 'Erro ao registrar a denúncia.' });
      }

      console.log('Denúncia registrada com sucesso:', result);
      
      // Configuração do transporter para enviar o e-mail com o arquivo como anexo
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'proagua372@gmail.com', // Seu e-mail
          pass: 'bxfv nslw unlf glad',  // Senha do seu Gmail (use OAuth2 ou App Password se tiver ativado 2FA)
        },
      });

      let mailOptions = {
        from: email,
        to: 'proagua372@gmail.com', // E-mail de destino
        subject: `Denúncia de ${Tipo_denuncia}`,
        text: `Denúncia recebida:\n\nDescrição: ${descricao}`,
        attachments: [
          {
            path: req.file.path, // O arquivo carregado
          },
        ],
      };

      // Enviar e-mail com o arquivo anexo
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Erro ao enviar e-mail:', error);
          return res.status(500).json({ success: false, message: 'Erro ao enviar a denúncia.' });
        }

        console.log('E-mail enviado com sucesso:', info);

        // Excluir o arquivo após enviar o e-mail
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error('Erro ao excluir o arquivo:', err);
          }
        });

        // Enviar uma resposta JSON de sucesso
        res.status(200).json({ success: true, message: 'Denúncia enviada com sucesso!' });
      });
    });
  });
});

// Iniciar o servidor
app.listen(3002, () => {
  console.log('Servidor rodando na porta 3002');
});
