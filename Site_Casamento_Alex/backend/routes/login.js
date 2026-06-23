const express =
require("express");

const bcrypt =
require("bcrypt");

const jwt =
require("jsonwebtoken");

const { conectar } =
require("../db");

const router =
express.Router();

router.post(
"/login",
async(req,res)=>{

    try{

        const {
            email,
            senha
        } = req.body;

        const db =
        await conectar();

        const result =
        await db.query(
            `
                SELECT *
                FROM "dbUsuarios"
                WHERE "Email" = $1
                AND "Ativo" = true
            `,
            [email]
        );

        if(
            result.rows.length === 0
        ){

            return res.status(401).json({
                erro:"Usuário não encontrado"
            });
        }

        const usuario =
        result.rows[0];

        const valida =
        await bcrypt.compare(
            senha,
            usuario.Senha
        );

        if(!valida){

            return res.status(401).json({
                erro:"Senha inválida"
            });
        }

        const token =
        jwt.sign(
            {
                id:
                usuario.Id_Usuario,

                perfil:
                usuario.Perfil
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }
        );

        res.json({

            token,

            id:
            usuario.Id_Usuario,

            nome:
            usuario.Nome,

            perfil:
            usuario.Perfil

        });

    }
    catch(erro){

        res.status(500).json({
            erro: erro.message
        });

    }

});

module.exports =
router;