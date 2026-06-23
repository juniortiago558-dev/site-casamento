const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Em produção, defina ALLOWED_ORIGIN no Render com a URL
// exata da Vercel (ex: https://seusite.vercel.app).
// Localmente, se ALLOWED_ORIGIN não estiver definido,
// libera tudo (útil para testar no seu computador).
const allowedOrigin = process.env.ALLOWED_ORIGIN;

app.use(
    cors(
        allowedOrigin
        ? { origin: allowedOrigin }
        : {}
    )
);

app.use(express.json());

app.use(require("./routes/login"));
app.use(require("./routes/usuarios"));
app.use(require("./routes/confirmacoes"));
app.use(require("./routes/presentes"));
app.use(require("./routes/reservas"));

app.get("/", (req, res) => {
    res.send("API Casamento funcionando");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor iniciado na porta " + PORT);
});