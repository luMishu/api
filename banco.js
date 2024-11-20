const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Porta configurável

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Configuração do banco de dados
const dbConfig = {
    host: '127.0.0.1', // Melhor especificar o IP local
    user: 'root',
    password: 'Michiura12',
    database: 'proagua',
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1); // Interrompe se não conseguir conectar
    }
    console.log('Conectado ao banco de dados como ID', connection.threadId);
});

// Rota de login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    connection.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.senha);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        res.json({ message: 'Login bem-sucedido!', user: { nome: user.nome, email: user.email } });
    });
});

// Rota de cadastro
app.post('/cadastro', async (req, res) => {
    const { nome, sobrenome, email, senha, confirmarSenha, genero, bairro } = req.body;

    if (!nome || !sobrenome || !email || !senha || !confirmarSenha || !genero || !bairro) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    if (senha !== confirmarSenha) {
        return res.status(400).json({ message: 'As senhas não correspondem!' });
    }

    try {
        const hashedSenha = await bcrypt.hash(senha, 10);
        const sql = 'INSERT INTO usuarios (nome, sobrenome, email, senha, genero, bairro) VALUES (?, ?, ?, ?, ?, ?)';
        connection.query(sql, [nome, sobrenome, email, hashedSenha, genero, bairro], (err, result) => {
            if (err) {
                console.error('Erro ao cadastrar usuário:', err);
                return res.status(500).json({ message: 'Erro ao cadastrar usuário. Tente novamente.' });
            }
            res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
        });
    } catch (error) {
        console.error('Erro ao processar cadastro:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
