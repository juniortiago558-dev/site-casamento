const express = require("express");
const auth = require("../middleware/auth");
const { conectar } = require("../db");

const router = express.Router();

router.post(
    "/reservas",
    auth,
    async (req, res) => {

        const pool =
            await conectar();

        const client =
            await pool.connect();

        try {

            const {
                idPresente
            } = req.body;

            const verifica =
                await client.query(
                    `
                        SELECT "Reservado"
                        FROM "dbPresentes"
                        WHERE "Id_Presente" = $1
                    `,
                    [idPresente]
                );

            if (
                verifica.rows.length === 0
            ) {

                return res.status(404).json({
                    erro:
                    "Presente não encontrado"
                });

            }

            if (
                verifica.rows[0]
                .Reservado
            ) {

                return res.status(400).json({
                    erro:
                    "Presente já reservado"
                });

            }

            // REGRA: usuário não pode reservar
            // mais de um presente.
            const jaTemReserva =
                await client.query(
                    `
                        SELECT "Id_Presente"
                        FROM "dbReservas"
                        WHERE "Id_Usuario" = $1
                        LIMIT 1
                    `,
                    [req.usuario.id]
                );

            if (
                jaTemReserva.rows.length > 0
            ) {

                return res.status(400).json({
                    erro:
                    "Você já reservou um presente. Libere-o antes de reservar outro."
                });

            }

            await client.query("BEGIN");

            try {

                await client.query(
                    `
                        INSERT INTO
                        "dbReservas"
                        (
                            "Id_Usuario",
                            "Id_Presente"
                        )
                        VALUES
                        ($1, $2)
                    `,
                    [req.usuario.id, idPresente]
                );

                await client.query(
                    `
                        UPDATE "dbPresentes"
                        SET "Reservado" = true
                        WHERE "Id_Presente" = $1
                    `,
                    [idPresente]
                );

                await client.query("COMMIT");

            }
            catch (erroTx) {

                await client.query("ROLLBACK");
                throw erroTx;

            }

            res.json({
                sucesso: true
            });

        }
        catch (erro) {

            res.status(500).json({
                erro: erro.message
            });

        }
        finally {

            client.release();

        }

    }
);

router.delete(
    "/reservas/:idPresente",
    auth,
    async (req, res) => {

        const pool =
            await conectar();

        const client =
            await pool.connect();

        try {

            const idPresente =
                Number(
                    req.params.idPresente
                );

            const verifica =
                await client.query(
                    `
                        SELECT
                            r."Id_Usuario",
                            p."Personalizado"
                        FROM "dbReservas" r
                        JOIN "dbPresentes" p
                            ON p."Id_Presente" = r."Id_Presente"
                        WHERE r."Id_Presente" = $1
                    `,
                    [idPresente]
                );

            if (
                verifica.rows.length === 0
            ) {

                return res.status(404).json({
                    erro:
                    "Este presente não está reservado"
                });

            }

            const idUsuarioDaReserva =
                verifica.rows[0]
                .Id_Usuario;

            const ehPersonalizado =
                verifica.rows[0]
                .Personalizado;

            // REGRA: só quem reservou pode liberar
            if (
                idUsuarioDaReserva !==
                req.usuario.id
            ) {

                return res.status(403).json({
                    erro:
                    "Você não pode liberar uma reserva que não é sua"
                });

            }

            await client.query("BEGIN");

            try {

                await client.query(
                    `
                        DELETE FROM
                        "dbReservas"
                        WHERE "Id_Presente" = $1
                    `,
                    [idPresente]
                );

                if (ehPersonalizado) {

                    // Presente sugerido pelo convidado:
                    // some da lista por completo, em vez
                    // de só ficar disponível de novo.
                    await client.query(
                        `
                            DELETE FROM
                            "dbPresentes"
                            WHERE "Id_Presente" = $1
                        `,
                        [idPresente]
                    );

                } else {

                    await client.query(
                        `
                            UPDATE "dbPresentes"
                            SET "Reservado" = false
                            WHERE "Id_Presente" = $1
                        `,
                        [idPresente]
                    );

                }

                await client.query("COMMIT");

            }
            catch (erroTx) {

                await client.query("ROLLBACK");
                throw erroTx;

            }

            res.json({
                sucesso: true
            });

        }
        catch (erro) {

            res.status(500).json({
                erro: erro.message
            });

        }
        finally {

            client.release();

        }

    }
);

module.exports = router;