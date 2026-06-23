// TROQUE pela URL do seu backend no Render depois do deploy
const API_URL = "http://localhost:3000";

// Se já estiver logado, redireciona
const token = localStorage.getItem("token");

if (token) {
    window.location.replace("index.html");
}

document
    .getElementById("cadastroForm")
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const nome =
                document
                    .getElementById("nome")
                    .value
                    .trim();

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

            const mensagem =
                document.getElementById(
                    "mensagem"
                );

            try {

                if (senha.length < 6) {

                    throw new Error(
                        "A senha deve possuir pelo menos 6 caracteres."
                    );

                }

                const resposta =
                    await fetch(
                        API_URL + "/usuarios",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                nome,
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
                        "Erro ao criar conta."
                    );

                }

                mensagem.textContent =
                    "Cadastro realizado com sucesso! Redirecionando para o login...";

                mensagem.style.color =
                    "green";

                setTimeout(
                    () => {

                        window.location.replace(
                            "login.html"
                        );

                    },
                    2000
                );

            }
            catch (erro) {

                if (mensagem) {

                    mensagem.textContent =
                        erro.message;

                    mensagem.style.color =
                        "red";

                } else {

                    alert(
                        erro.message
                    );

                }

                console.error(
                    erro
                );

            }

        }
    );