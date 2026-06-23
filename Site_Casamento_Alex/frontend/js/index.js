// =========================================
// CONFIGURAÇÃO
// =========================================

// TROQUE pela URL do seu backend no Render depois do deploy
// Exemplo: "https://casamento-backend.onrender.com"
const API_URL = "https://site-casamento-gsp4.onrender.com";

const token = localStorage.getItem("token");

let usuario = null;

try {
    usuario = JSON.parse(
        localStorage.getItem("usuario")
    );
} catch (e) {
    usuario = null;
}

const WEDDING_DATE_ISO = "2026-08-22T00:00:00-03:00";
const LOCAL_NOME = "Fazenda Sobradinho";
const LOCAL_ENDERECO = "Fazenda Sobradinho, (COLOQUE AQUI O ENDEREÇO COMPLETO), Brasil";

// =========================================
// PROTEÇÃO
// =========================================

if (!token) {
    window.location.replace("login.html");
}

// =========================================
// USUÁRIO LOGADO
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        try {

            if (usuario && usuario.Nome) {

                document.getElementById(
                    "userName"
                ).textContent =
                usuario.Nome;

                document.getElementById(
                    "avatarLetter"
                ).textContent =
                usuario.Nome
                .charAt(0)
                .toUpperCase();

                const role =
                document.getElementById(
                    "userRole"
                );

                if(role){
                    role.textContent =
                    usuario.perfil;
                }

                document.getElementById(
                    "userPanel"
                ).style.display =
                "flex";

                if(usuario.perfil === "ADM"){

                    const btnAdmin =
                    document.getElementById(
                        "btnNavConfirmacoesAdmin"
                    );

                    const btnRsvp =
                    document.getElementById(
                        "btnNavRsvp"
                    );

                    const btnPresentes =
                    document.getElementById(
                        "btnNavPresentes"
                    );

                    if(btnAdmin){
                        btnAdmin.style.display = "inline-block";
                    }

                    if(btnRsvp){
                        btnRsvp.style.display = "none";
                    }

                    if(btnPresentes){
                        btnPresentes.style.display = "none";
                    }

                    go("confirmacoesAdmin");

                }

            }

        } catch (e) {
            console.error("Erro ao exibir usuário:", e);
        }

        try {

            const form =
            document.getElementById(
                "rsvpForm"
            );

            if(form){

                form.addEventListener(
                    "submit",
                    enviarConfirmacao
                );

            }

        } catch (e) {
            console.error("Erro ao registrar form RSVP:", e);
        }

        try {
            renderPresentes();
        } catch (e) {
            console.error("Erro ao renderizar presentes:", e);
        }

        try {
            verificarConfirmacaoExistente();
        } catch (e) {
            console.error("Erro ao verificar confirmação existente:", e);
        }

    }
);

// =========================================
// LOGOUT
// =========================================

function logout(){

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "usuario"
    );

    window.location.replace(
        "login.html"
    );
}

// =========================================
// RSVP
// =========================================

async function verificarConfirmacaoExistente(){

    // OBS: depende de uma rota no backend que devolva
    // a confirmação do usuário logado (ex: GET /confirmacoes/minha)
    // Ajustar a URL conforme a rota real do seu backend.

    try{

        const resposta =
        await fetch(
            API_URL +
            "/confirmacoes/minha",
            {
                headers:{
                    Authorization:
                    "Bearer " +
                    token
                }
            }
        );

        if(!resposta.ok) return;

        const dados =
        await resposta.json();

        if(dados && dados.jaConfirmou){

            const aviso =
            document.getElementById(
                "rsvpAviso"
            );

            if(aviso){

                aviso.style.display = "block";

                aviso.textContent =
                dados.confirmacao
                ? "Você já confirmou presença!"
                : "Você já respondeu que não vai comparecer.";

            }

        }

    }
    catch(erro){
        console.error("Erro ao verificar confirmação:", erro);
    }

}

async function enviarConfirmacao(
    e
){

    e.preventDefault();

    try{

        const fd =
        new FormData(
            e.target
        );

        const resposta =
        await fetch(
            API_URL +
            "/confirmacoes",
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json",

                    Authorization:
                    "Bearer " +
                    token
                },

                body:JSON.stringify({

                    confirmacao:
                    fd.get("vai") === "Vou",

                    quantidadePessoas:
                    Number(
                        fd.get("qtd")
                    ),

                    acompanhantes:
                    fd.get("acomp"),

                    observacoes:
                    fd.get("obs")

                })
            }
        );

        const dados =
        await resposta.json();

        if(!resposta.ok){

            throw new Error(
                dados.erro || "Não foi possível enviar a confirmação."
            );

        }

        document
        .getElementById(
            "rsvpOk"
        )
        .style.display =
        "block";

        setTimeout(
            ()=>{

                document
                .getElementById(
                    "rsvpOk"
                )
                .style.display =
                "none";

                go("presentes");

            },
            1500
        );

    }
    catch(erro){

        alert(
            erro.message
        );

    }

}

// =========================================
// PRESENTES
// =========================================

async function carregarPresentes(){

    const resposta =
    await fetch(
        API_URL +
        "/presentes",
        {
            headers:{
                Authorization:
                "Bearer " +
                token
            }
        }
    );

    return await resposta.json();

}

function caminhoImagemPresente(imagem){

    if(!imagem){
        return null;
    }

    // Se a coluna já vier com o caminho completo (ex: "img/presentes/x.jpg"
    // ou começando com "/"), usamos como está.
    if(
        imagem.includes("/") ||
        imagem.startsWith("http")
    ){
        return imagem;
    }

    // Se vier só o nome do arquivo (ex: "panela.jpg"),
    // completamos com a pasta local.
    return "img/presentes/" + imagem;

}

let presentesCache = [];

async function renderPresentes(){

    const presentes =
    await carregarPresentes();

    presentesCache = presentes;

    const idUsuarioLogado =
    usuario ? usuario.Id_Usuario : null;

    aplicarFiltrosPresentes();

    renderSecaoOutroPresente(
        presentesCache,
        idUsuarioLogado
    );

}

function renderCardPresente(
    presente,
    idUsuarioLogado
){

    // Quem reservou este item (precisa vir do backend
    // no campo Id_Usuario_Reserva ou equivalente)
    const reservadoPorMim =
    presente.Reservado &&
    idUsuarioLogado &&
    presente.Id_Usuario_Reserva === idUsuarioLogado;

    let botaoHtml = "";

    if(!presente.Reservado){

        // Disponível -> pode reservar
        botaoHtml = `
            <button onclick="reservarPresente(${presente.Id_Presente})">
                Vou presentear este item
            </button>
        `;

    } else if (reservadoPorMim) {

        // Reservado por mim -> posso liberar
        botaoHtml = `
            <button onclick="liberarPresente(${presente.Id_Presente})">
                Liberar este presente
            </button>
        `;

    } else {

        // Reservado por outra pessoa -> bloqueado
        botaoHtml = `
            <button disabled>
                Indisponível
            </button>
        `;

    }

    const caminhoImg =
    caminhoImagemPresente(
        presente.Imagem
    );

    const imgHtml =
    caminhoImg
    ? `
        <img
            src="${caminhoImg}"
            alt="${presente.Nome_Presente}"
            class="itemImg"
            onerror="this.style.display='none'"
        >
    `
    : "";

    return `
        <div class="item">

            ${imgHtml}

            <div class="itemTop">

                <div>

                    <h3>
                        ${presente.Nome_Presente}
                    </h3>

                    <small>
                        ${presente.Categoria}
                    </small>

                </div>

                <span class="status ${
                    presente.Reservado
                    ? "busy"
                    : "ok"
                }">

                    ${
                        presente.Reservado
                        ? (reservadoPorMim ? "Reservado por você" : "Reservado")
                        : "Disponível"
                    }

                </span>

            </div>

            <div class="actions">
                ${botaoHtml}
            </div>

        </div>
    `;

}

function aplicarFiltrosPresentes(){

    const lista =
    document.getElementById(
        "listaPresentes"
    );

    if(!lista) return;

    const idUsuarioLogado =
    usuario ? usuario.Id_Usuario : null;

    const buscaEl =
    document.getElementById(
        "filtroBusca"
    );

    const disponivelEl =
    document.getElementById(
        "filtroDisponivel"
    );

    const termo =
    buscaEl
    ? buscaEl.value.trim().toLowerCase()
    : "";

    const somenteDisponiveis =
    disponivelEl
    ? disponivelEl.checked
    : false;

    const filtrados =
    presentesCache.filter(
        presente => {

            const nome =
            (presente.Nome_Presente || "")
            .toLowerCase();

            const categoria =
            (presente.Categoria || "")
            .toLowerCase();

            const termoOk =
            !termo ||
            nome.includes(termo) ||
            categoria.includes(termo);

            const disponivelOk =
            !somenteDisponiveis ||
            !presente.Reservado;

            return termoOk && disponivelOk;

        }
    );

    if(filtrados.length === 0){

        lista.innerHTML = `
            <p class="mini">
                Nenhum presente encontrado.
            </p>
        `;

        return;

    }

    // Agrupar por categoria
    const grupos = {};

    filtrados.forEach(
        presente => {

            const categoria =
            presente.Categoria || "Outros";

            if(!grupos[categoria]){
                grupos[categoria] = [];
            }

            grupos[categoria].push(presente);

        }
    );

    const categoriasOrdenadas =
    Object.keys(grupos).sort(
        (a, b) => a.localeCompare(b)
    );

    lista.innerHTML =
    categoriasOrdenadas.map(
        categoria => {

            const itensHtml =
            grupos[categoria].map(
                presente =>
                renderCardPresente(
                    presente,
                    idUsuarioLogado
                )
            ).join("");

            return `
                <h3 class="categoriaTitulo">
                    ${categoria}
                </h3>

                <div class="categoriaGrupo">
                    ${itensHtml}
                </div>
            `;

        }
    ).join("");

}

// =========================================
// "QUERO PRESENTEAR OUTRO PRESENTE"
// =========================================

function renderSecaoOutroPresente(
    presentes,
    idUsuarioLogado
){

    const box =
    document.getElementById(
        "secaoOutroPresente"
    );

    if(!box) return;

    const usuarioJaReservou =
    presentes.some(
        p =>
        idUsuarioLogado &&
        p.Id_Usuario_Reserva === idUsuarioLogado
    );

    if(usuarioJaReservou){

        box.innerHTML = `
            <div class="card" style="margin-top:16px;">
                <p class="mini">
                    Você já reservou um presente.
                    Libere-o na lista acima caso queira
                    sugerir outro.
                </p>
            </div>
        `;

        return;

    }

    const sugestoes =
    presentes.filter(
        p => p.Personalizado
    );

    const listaSugestoesHtml =
    sugestoes.length
    ? `
        <p class="mini">
            Presentes já sugeridos por outros convidados
            (escolha algo diferente para não repetir):
        </p>

        <ul class="listaSugestoes">
            ${
                sugestoes.map(
                    p => `<li>${p.Nome_Presente}</li>`
                ).join("")
            }
        </ul>
    `
    : `
        <p class="mini">
            Nenhuma sugestão registrada ainda.
            Seja o primeiro a sugerir!
        </p>
    `;

    box.innerHTML = `
        <div class="card" style="margin-top:16px;">

            <button
                type="button"
                id="btnOutroPresente"
                onclick="mostrarFormOutroPresente()">

                Quero presentear outro presente

            </button>

            <div
                id="formOutroPresente"
                style="display:none; margin-top:12px;">

                ${listaSugestoesHtml}

                <label>
                    O que você gostaria de presentear?
                </label>

                <input
                    type="text"
                    id="inputOutroPresente"
                    placeholder="Digite o nome do presente">

                <div class="actions" style="margin-top:10px;">

                    <button
                        type="button"
                        class="primary"
                        onclick="enviarOutroPresente()">

                        Confirmar e reservar

                    </button>

                </div>

            </div>

        </div>
    `;

}

function mostrarFormOutroPresente(){

    const form =
    document.getElementById(
        "formOutroPresente"
    );

    const btn =
    document.getElementById(
        "btnOutroPresente"
    );

    if(form) form.style.display = "block";
    if(btn) btn.style.display = "none";

}

async function enviarOutroPresente(){

    const input =
    document.getElementById(
        "inputOutroPresente"
    );

    const nomePresente =
    input ? input.value.trim() : "";

    if(!nomePresente){
        alert("Digite o nome do presente.");
        return;
    }

    try{

        const resposta =
        await fetch(
            API_URL +
            "/presentes/personalizado",
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json",

                    Authorization:
                    "Bearer " +
                    token
                },

                body:
                JSON.stringify({
                    nomePresente
                })
            }
        );

        const dados =
        await resposta.json();

        if(!resposta.ok){

            throw new Error(
                dados.erro ||
                "Não foi possível registrar o presente."
            );

        }

        alert(
            "Presente registrado e reservado com sucesso!"
        );

        renderPresentes();

    }
    catch(erro){

        alert(
            erro.message
        );

    }

}

async function reservarPresente(
    idPresente
){

    try{

        const resposta =
        await fetch(
            API_URL +
            "/reservas",
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json",

                    Authorization:
                    "Bearer " +
                    token
                },

                body:
                JSON.stringify({
                    idPresente
                })
            }
        );

        const dados =
        await resposta.json();

        if(!resposta.ok){

            throw new Error(
                dados.erro || "Não foi possível reservar este presente."
            );

        }

        alert(
            "Presente reservado com sucesso!"
        );

        renderPresentes();

    }
    catch(erro){

        alert(
            erro.message
        );

    }

}

async function liberarPresente(
    idPresente
){

    // OBS: depende de uma rota DELETE /reservas/:idPresente
    // (ou similar) no backend, que só deve permitir a liberação
    // se o usuário logado for quem reservou o item.

    try{

        const resposta =
        await fetch(
            API_URL +
            "/reservas/" +
            idPresente,
            {
                method:"DELETE",

                headers:{
                    Authorization:
                    "Bearer " +
                    token
                }
            }
        );

        const dados =
        await resposta.json();

        if(!resposta.ok){

            throw new Error(
                dados.erro || "Não foi possível liberar este presente."
            );

        }

        alert(
            "Presente liberado!"
        );

        renderPresentes();

    }
    catch(erro){

        alert(
            erro.message
        );

    }

}

function go(id){
    document.querySelectorAll("main section").forEach(s=>s.style.display="none");
    const el = document.getElementById(id);
    if(!el) return;
    el.style.display = (id==="rsvp") ? "grid" : "block";

    if(id==="presentes"){ renderPresentes(); }
    if(id==="confirmacoesAdmin"){ renderConfirmacoesAdmin(); }

    window.scrollTo({top:0, behavior:"smooth"});
}

// =========================================
// LISTA DE CONFIRMAÇÃO (ADMIN)
// =========================================

async function renderConfirmacoesAdmin(){

    const container =
    document.getElementById(
        "tabelaConfirmacoesAdmin"
    );

    if(!container) return;

    container.innerHTML =
    `<p class="mini">Carregando...</p>`;

    try{

        const resposta =
        await fetch(
            API_URL +
            "/confirmacoes/admin",
            {
                headers:{
                    Authorization:
                    "Bearer " +
                    token
                }
            }
        );

        const dados =
        await resposta.json();

        if(!resposta.ok){

            throw new Error(
                dados.erro ||
                "Não foi possível carregar a listagem."
            );

        }

        if(dados.length === 0){

            container.innerHTML =
            `<p class="mini">Nenhuma confirmação registrada ainda.</p>`;

            return;

        }

        container.innerHTML = `
            <table class="tabelaAdmin">

                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Vai?</th>
                        <th>Qtd. Pessoas</th>
                        <th>Acompanhantes</th>
                        <th>Observações</th>
                        <th>Presente Escolhido</th>
                    </tr>
                </thead>

                <tbody>
                    ${
                        dados.map(
                            linha => `
                                <tr>
                                    <td>${linha.NomeConvidado}</td>
                                    <td>${linha.Confirmacao ? "Sim" : "Não"}</td>
                                    <td>${linha.QuantidadePessoas}</td>
                                    <td>${linha.Acompanhantes || "-"}</td>
                                    <td>${linha.Observacoes || "-"}</td>
                                    <td>${linha.Nome_Presente || "-"}</td>
                                </tr>
                            `
                        ).join("")
                    }
                </tbody>

            </table>
        `;

    }
    catch(erro){

        container.innerHTML =
        `<p class="mini">${erro.message}</p>`;

    }

}

function pad2(n){
    return String(n).padStart(2,"0");
}

function updateCountdown(){

    const target = new Date(WEDDING_DATE_ISO).getTime();
    const now = Date.now();
    const diff = target - now;

    const txt = document.getElementById("cdTexto");
    const dEl = document.getElementById("cdDias");
    const hEl = document.getElementById("cdHoras");
    const mEl = document.getElementById("cdMin");
    const sEl = document.getElementById("cdSeg");

    if(!txt || !dEl || !hEl || !mEl || !sEl) return;

    if(diff <= 0){
      dEl.textContent = "0"; hEl.textContent = "00"; mEl.textContent = "00"; sEl.textContent = "00";
      txt.textContent = "Chegou o grande dia! 🎉";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600*24));
    const hours = Math.floor((totalSeconds % (3600*24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    dEl.textContent = String(days);
    hEl.textContent = pad2(hours);
    mEl.textContent = pad2(minutes);
    sEl.textContent = pad2(seconds);

    txt.textContent = `Nos vemos em ${days} dia(s)!`;
}

function abrirMapa(app){
    const query = `${LOCAL_NOME} - ${LOCAL_ENDERECO}`.trim();
    if(app === "waze"){
      window.open(
            `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`,
            "_blank"
        );
    } else {
      window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
            "_blank"
        );
    }
}

async function copiarEndereco(){
    const texto = `${LOCAL_NOME} — ${LOCAL_ENDERECO}`;
    try{
      await navigator.clipboard.writeText(texto);
      alert("Endereço copiado!");
    }catch(e){
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Endereço copiado!");
    }
}

function renderEndereco(){
    const nomeEl = document.getElementById("localNome");
    const endEl = document.getElementById("enderecoTexto");
    if(nomeEl) nomeEl.textContent = LOCAL_NOME;
    if(endEl) endEl.textContent = `Endereço: ${LOCAL_ENDERECO}`;
}


renderEndereco();

updateCountdown();

setInterval(
    updateCountdown,
    1000
);

go("rsvp");
