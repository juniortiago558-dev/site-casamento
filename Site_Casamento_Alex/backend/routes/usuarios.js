const express = require("express");
const bcrypt = require("bcrypt");
const dns = require("dns").promises;

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const { conectar } =
require("../db");

const router =
express.Router();

async function emailValido(email) {
    const dominio = email.split("@")[1];
    try {
        const mx = await dns.resolveMx(dominio);
        return mx.length > 0;
    } catch {
        return false;
    }
}

router.post(
"/usuarios",
async(req,res)=>{

    try{

        const {
            nome,
            email,
            senha,
            telefone
        } = req.body;

        if (!(await emailValido(email))) {
            return res.status(400).json({
                erro: "Email inválido."
            });
        }

        const hash =
        await bcrypt.hash(
            senha,
            10
        );

        const db =
        await conectar();

        await db.query(
            `
                INSERT INTO "dbUsuarios"
                (
                    "Nome",
                    "Email",
                    "Senha",
                    "Telefone"
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4
                )
            `,
            [nome, email, hash, telefone]
        );

        res.json({
            sucesso:true
        });

    }
    catch(erro){

        // Email duplicado (violação de UNIQUE)
        if(erro.code === "23505"){

            return res.status(400).json({
                erro: "Este email já está cadastrado."
            });

        }

        res.status(500).json({
            erro: erro.message
        });

    }

});

module.exports =
router;