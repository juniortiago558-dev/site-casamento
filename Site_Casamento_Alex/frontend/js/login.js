// TROQUE pela URL do seu backend no Render depois do deploy
const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");

if (token) {
    window.location.replace("index.html");
}

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

            const senha =
                document
                    .getElementById("senha")
                    .value;

            try {

                const resposta =
                    await fetch(
                        `${API_URL}/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                email,
                                senha
                            })
                        }
                    );

                const dados =
                    await resposta.json();

                if (!resposta.ok) {

                    throw new Error(
                        dados.erro ||
                        "Email ou senha inválidos."
                    );

                }

                localStorage.setItem(
                    "token",
                    dados.token
                );

                // O backend devolve { token, nome, perfil, id }
                // (objeto plano, NÃO um campo "usuario").
                // Por isso montamos o objeto "usuario" aqui no front-end:
                localStorage.setItem(
                    "usuario",
                    JSON.stringify({
                        Id_Usuario: dados.id,
                        Nome: dados.nome,
                        perfil: dados.perfil
                    })
                );

                window.location.replace(
                    "index.html"
                );

            }
            catch (erro) {

                console.error(
                    "Erro login:",
                    erro
                );

                alert(
                    erro.message
                );

            }

        }
    );