const express =
require("express");

const auth =
require("../middleware/auth");

const admin =
require("../middleware/admin");

const { conectar } =
require("../db");

const router =
express.Router();

router.post(
"/confirmacoes",
auth,
async(req,res)=>{

    try{

        const {
            confirmacao,
            quantidadePessoas,
            acompanhantes,
            observacoes
        } = req.body;

        const db =
        await conectar();

        // UPSERT: equivalente ao MERGE do SQL Server.
        // Graças à UNIQUE("Id_Usuario") em dbConfirmacoes,
        // se já existir confirmação para esse usuário,
        // ela é atualizada; senão, é criada.
        await db.query(
            `
                INSERT INTO "dbConfirmacoes"
                (
                    "Id_Usuario",
                    "Confirmacao",
                    "QuantidadePessoas",
                    "Acompanhantes",
                    "Observacoes"
                )
                VALUES
                ($1, $2, $3, $4, $5)

                ON CONFLICT ("Id_Usuario")
                DO UPDATE SET
                    "Confirmacao" = EXCLUDED."Confirmacao",
                    "QuantidadePessoas" = EXCLUDED."QuantidadePessoas",
                    "Acompanhantes" = EXCLUDED."Acompanhantes",
                    "Observacoes" = EXCLUDED."Observacoes"
            `,
            [
                req.usuario.id,
                confirmacao,
                quantidadePessoas,
                acompanhantes,
                observacoes
            ]
        );

        res.json({
            sucesso:true
        });

    }
    catch(erro){

        res.status(500).json({
            erro: erro.message
        });

    }

});

// Rota que o front-end usa para saber se o usuário
// logado já confirmou presença antes.
router.get(
"/confirmacoes/minha",
auth,
async(req,res)=>{

    try{

        const db =
        await conectar();

        const result =
        await db.query(
            `
                SELECT
                    "Confirmacao",
                    "QuantidadePessoas",
                    "Acompanhantes",
                    "Observacoes"
                FROM "dbConfirmacoes"
                WHERE "Id_Usuario" = $1
            `,
            [req.usuario.id]
        );

        if(result.rows.length === 0){

            return res.json({
                jaConfirmou: false
            });

        }

        res.json({
            jaConfirmou: true,
            confirmacao: result.rows[0].Confirmacao,
            quantidadePessoas: result.rows[0].QuantidadePessoas,
            acompanhantes: result.rows[0].Acompanhantes,
            observacoes: result.rows[0].Observacoes
        });

    }
    catch(erro){

        res.status(500).json({
            erro: erro.message
        });

    }

});

// Listagem completa para o ADM: nome, quantidade,
// acompanhantes, confirmação, observações e o
// presente reservado por cada pessoa (se houver).
router.get(
"/confirmacoes/admin",
auth,
admin,
async(req,res)=>{

    try{

        const db =
        await conectar();

        const result =
        await db.query(
            `
                SELECT
                    u."Nome" AS "NomeConvidado",
                    c."Confirmacao",
                    c."QuantidadePessoas",
                    c."Acompanhantes",
                    c."Observacoes",
                    p."Nome_Presente"
                FROM "dbConfirmacoes" c
                JOIN "dbUsuarios" u
                    ON u."Id_Usuario" = c."Id_Usuario"
                LEFT JOIN "dbReservas" r
                    ON r."Id_Usuario" = c."Id_Usuario"
                LEFT JOIN "dbPresentes" p
                    ON p."Id_Presente" = r."Id_Presente"
                ORDER BY u."Nome"
            `
        );

        res.json(
            result.rows
        );

    }
    catch(erro){

        res.status(500).json({
            erro: erro.message
        });

    }

});

module.exports =
router;