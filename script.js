/* ============================
   COORININVEST — SCRIPT CORRIGIDO
   ============================ */

// Nome do banco no localStorage
const APP_KEY = "CoorinInvest_DB";

// Variável global do gráfico
let pieChart = null;

/* ============================
      DADOS INICIAIS ORGÂNICOS
   ============================ */

function seedIfEmpty() {
    if (localStorage.getItem(APP_KEY)) return;

    const today = new Date().toISOString().slice(0, 10);

    const db = {
        Pessoa: [
            {
                Id_Pessoa: 1,
                Nome: "Lucas",
                Sobrenome: "Ferreira",
                Email: "lucas.ferreira@example.com",
            }
        ],

        Perfil: [
            { Id_Perfil: 1, Perfil: "Cliente Padrão" }
        ],

        Cliente: [
            { Id_Cliente: 1, Id_Pessoa: 1, Id_Perfil: 1, Data_Registro: today }
        ],

        Tipo: [
            { Id_Tipo: 1, Tipo: "Ações" },
            { Id_Tipo: 2, Tipo: "Cripto" },
            { Id_Tipo: 3, Tipo: "Renda Fixa" },
            { Id_Tipo: 4, Tipo: "ETFs" }
        ],

        Risco: [
            { Id_Risco: 1, Risco: "Alto" },
            { Id_Risco: 2, Risco: "Médio" },
            { Id_Risco: 3, Risco: "Baixo" }
        ],

        Investimento: [
            {
                Id_Investimento: 1,
                Id_Tipo: 1,
                Id_Risco: 2,
                Nome: "BBAS3",
                Rentabilidade_Prevista: 7.2
            },
            {
                Id_Investimento: 2,
                Id_Tipo: 2,
                Id_Risco: 1,
                Nome: "Bitcoin",
                Rentabilidade_Prevista: 18.5
            },
            {
                Id_Investimento: 3,
                Id_Tipo: 3,
                Id_Risco: 3,
                Nome: "Tesouro Selic",
                Rentabilidade_Prevista: 5.9
            }
        ],

        ItensCarteira: [
            { Id_Carteira: 1, Id_Investimento: 1 },
            { Id_Carteira: 1, Id_Investimento: 2 },
            { Id_Carteira: 1, Id_Investimento: 3 }
        ]
    };

    localStorage.setItem(APP_KEY, JSON.stringify(db));
}

/* ============================
      ACESSO AO BANCO LOCAL
   ============================ */

function db() {
    return JSON.parse(localStorage.getItem(APP_KEY));
}

function saveDb(newDb) {
    localStorage.setItem(APP_KEY, JSON.stringify(newDb));
}

/* ============================
         LOGIN SIMPLES
   ============================ */

function login(email, senha) {
    return (email === "aluno@example.com" && senha === "123");
}

/* ============================
      NAVEGAÇÃO PRINCIPAL
   ============================ */

function showScreen(screen) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(screen).classList.remove("hidden");
}

/* ============================
      CARREGAMENTO DO DASHBOARD
   ============================ */

function loadInvestTable() {
    const d = db();
    const tbody = document.getElementById("tbody-invest");

    tbody.innerHTML = "";

    d.Investimento.forEach(inv => {
        const tipoNome = d.Tipo.find(t => t.Id_Tipo === inv.Id_Tipo).Tipo;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${inv.Nome}</td>
            <td>${tipoNome}</td>
            <td>${inv.Rentabilidade_Prevista}%</td>
        `;
        tbody.appendChild(tr);
    });
}

/* ============================
        GRÁFICO DE PIZZA
   ============================ */

function loadPieChart() {
    const d = db();
    const ctx = document.getElementById("investPieChart");

    if (!ctx) return;

    // Soma rentabilidade por tipo
    const totals = {};
    d.Investimento.forEach(inv => {
        const tipo = d.Tipo.find(t => t.Id_Tipo === inv.Id_Tipo).Tipo;
        totals[tipo] = (totals[tipo] || 0) + inv.Rentabilidade_Prevista;
    });

    const labels = Object.keys(totals);
    const data = Object.values(totals);

    // Cores orgânicas e diferentes
    const colors = [
        "#ff7a00", "#ffb14a",
        "#1f77b4", "#2ca02c",
        "#d62728", "#9467bd"
    ];

    if (pieChart) pieChart.destroy();

    pieChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, labels.length)
            }]
        },
        options: {
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

/* ============================
     ADICIONAR INVESTIMENTO
   ============================ */

function addInvestment() {
    const name = document.getElementById("inv-name").value;
    const type = Number(document.getElementById("inv-type").value);
    const rent = Number(document.getElementById("inv-rent").value);

    if (!name || !type || !rent) {
        alert("Preencha todos os campos!");
        return;
    }

    const d = db();

    const nextId = d.Investimento.length
        ? Math.max(...d.Investimento.map(i => i.Id_Investimento)) + 1
        : 1;

    d.Investimento.push({
        Id_Investimento: nextId,
        Id_Tipo: type,
        Id_Risco: 2,
        Nome: name,
        Rentabilidade_Prevista: rent
    });

    saveDb(d);

    loadInvestTable();
    loadPieChart();

    document.getElementById("inv-name").value = "";
    document.getElementById("inv-rent").value = "";
}

/* ============================
     INICIALIZAÇÃO DA PÁGINA
   ============================ */

document.addEventListener("DOMContentLoaded", () => {
    seedIfEmpty();

    // LOGIN
    document.getElementById("btn-login").onclick = () => {
        const email = document.getElementById("login-email").value;
        const senha = document.getElementById("login-pass").value;

        if (login(email, senha)) {
            showScreen("dashboard-screen");
            loadInvestTable();
            loadPieChart();
        } else {
            alert("Usuário ou senha incorretos.");
        }
    };

    // BOTÃO ADICIONAR INVESTIMENTO
    document.getElementById("btn-add-inv").onclick = addInvestment;
});
