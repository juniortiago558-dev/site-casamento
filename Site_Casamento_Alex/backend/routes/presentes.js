const express = require("express");
const auth = require("../middleware/auth");
const { conectar } = require("../db");

const router = express.Router();

router.get(
    "/presentes",
    auth,
    async (req, res) => {

        try {

            const db =
                await conectar();

            const result =
                await db.query(`
                    SELECT
                        p."Id_Presente",
                        p."Nome_Presente",
                        p."Categoria",
                        p."Reservado",
                        p."Imagem",
                        p."Personalizado",
                        r."Id_Usuario" AS "Id_Usuario_Reserva"
                    FROM "dbPresentes" p
                    LEFT JOIN "dbReservas" r
                        ON r."Id_Presente" = p."Id_Presente"
                    ORDER BY p."Personalizado" ASC, p."Nome_Presente" ASC
                `);

            res.json(
                result.rows
            );

        }
        catch (erro) {

            res.status(500).json({
                erro: erro.message
            });

        }

    }
);

// Cria um presente sugerido pelo convidado
// e já reserva ele para essa mesma pessoa.
router.post(
    "/presentes/personalizado",
    auth,
    async (req, res) => {

        const pool =
            await conectar();

        const client =
            await pool.connect();

        try {

            const {
                nomePresente
            } = req.body;

            if (
                !nomePresente ||
                !nomePresente.trim()
            ) {

                return res.status(400).json({
                    erro:
                    "Informe o nome do presente."
                });

            }

            // REGRA: usuário não pode reservar
            // mais de um presente (catálogo ou
            // personalizado).
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

                const novoPresente =
                    await client.query(
                        `
                            INSERT INTO "dbPresentes"
                            (
                                "Nome_Presente",
                                "Categoria",
                                "Reservado",
                                "Personalizado"
                            )
                            VALUES
                            ($1, 'Sugestão do convidado', true, true)
                            RETURNING "Id_Presente"
                        `,
                        [nomePresente.trim()]
                    );

                const idPresente =
                    novoPresente.rows[0]
                    .Id_Presente;

                await client.query(
                    `
                        INSERT INTO "dbReservas"
                        (
                            "Id_Usuario",
                            "Id_Presente"
                        )
                        VALUES
                        ($1, $2)
                    `,
                    [req.usuario.id, idPresente]
                );

                await client.query("COMMIT");

                res.json({
                    sucesso: true,
                    idPresente
                });

            }
            catch (erroTx) {

                await client.query("ROLLBACK");
                throw erroTx;

            }

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