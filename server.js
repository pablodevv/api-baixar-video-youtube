require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8100;

app.use(cors());
app.use(express.json());

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};


app.get("/tabelas", async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        const tabelas = result.recordset.map(item => item.TABLE_NAME);
        res.json(tabelas);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get("/dados/:tabela", async (req, res) => {
    const { tabela } = req.params;

    try {
        await sql.connect(dbConfig);

        const query = `SELECT * FROM ${tabela}`;
        const result = await sql.query(query);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(`Erro ao consultar dados: ${err.message}`);
    }
});


app.get("/consulta", async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).send("Query SQL não fornecida.");
    }


    const allowedKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING'];
    const queryLower = query.toUpperCase();


    if (!allowedKeywords.some(keyword => queryLower.includes(keyword))) {
        return res.status(400).send("Query contém palavras não permitidas.");
    }

    try {
        await sql.connect(dbConfig);


        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(`Erro ao consultar dados: ${err.message}`);
    }
});


app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});
