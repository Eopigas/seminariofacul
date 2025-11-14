// script.js — Simulação completa do DER usando localStorage
const APP_KEY = 'ci_der_demo_v1';
let overviewPieChart = null;

// ----------------------- SEED (cria todas as tabelas) -----------------------
function seedIfEmpty(){
  if(localStorage.getItem(APP_KEY)) return;
  const now = new Date().toISOString().slice(0,10);
  const data = {
    Pais: [{Id_Pais:1, Nome:'Brasil'}],
    Estado: [{Id_Estado:1, Id_Pais:1, Nome:'São Paulo'}],
    Endereco: [{Id_Endereco:1, Id_Estado:1}],
    Pessoa: [{Id_Pessoa:1, Id_Endereco:1, Nome:'Aluno', Sobrenome:'Demo', Email:'aluno@example.com', Sexo:'M', Telefone:'119999999', Data_Nascimento:'1990-01-01'}],
    Departamento: [{Id_Departamento:1, Nome:'Consultoria'}],
    Cargo: [{Id_Cargo:1, Nome:'Analista', Salario_Base:5000}],
    Contrato: [{Id_Contrato:1, Id_Departamento:1, Id_Cargo:1, Data_Contrato:now}],
    Status: [{Id_Status:1, Status:'Ativo', Data_Atribuicao:now}],
    Funcionario: [{Id_Funcionario:1, Id_Pessoa:1, Id_Contrato:1, Id_Status:1}],
    Bonus: [],
    Situacao: [{Id_Situacao:1, Situacao:'Ativo', Data_Atribuicao:now}],
    Consultor: [{Id_Consultor:1, Id_Funcionario:1, Id_Situacao:1, Descricao:'Consultor chefe'}],
    Perfil: [{Id_Perfil:1, Perfil:'Cliente Padrão'}],
    Cliente: [{Id_Cliente:1, Id_Pessoa:1, Id_Perfil:1, Data_Registro:now}],
    PessoaFisica: [{Id_Cliente:1, CPF:'12345678901'}],
    PessoaJuridica: [],
    Carteira: [{Id_Carteira:1, Id_Cliente:1, Nome:'Carteira Demo', Data_Criacao:now}],
    Risco: [{Id_Risco:1, Risco:'Alto'},{Id_Risco:2,Risco:'Médio'},{Id_Risco:3,Risco:'Baixo'}],
    Tipo: [{Id_Tipo:1, Tipo:'Ações'},{Id_Tipo:2, Tipo:'Cripto'},{Id_Tipo:3, Tipo:'Renda Fixa'}],
    Investimento: [
      {Id_Investimento:1, Id_Tipo:1, Id_Risco:2, Nome:'VALE3', Rentabilidade_Prevista:0.12, Descricao:'Ação Demo'},
      {Id_Investimento:2, Id_Tipo:2, Id_Risco:1, Nome:'Bitcoin', Rentabilidade_Prevista:0.2, Descricao:'Cripto Demo'}
    ],
    ItensCarteira: [
      {Id_Carteira:1, Id_Investimento:1, Data_Aquisicao:now},
      {Id_Carteira:1, Id_Investimento:2, Data_Aquisicao:now}
    ],
    Orientacao: [],
    ItensOrientacao: []
  };
  localStorage.setItem(APP_KEY, JSON.stringify(data));
}

// ----------------------- DB HELPERS -----------------------
function db(){ return JSON.parse(localStorage.getItem(APP_KEY) || '{}'); }
function saveDb(d){ localStorage.setItem(APP_KEY, JSON.stringify(d)); }
function nextId(arr, key){ return (arr && arr.reduce((m,x)=>Math.max(m, x[key]||0),0) || 0) + 1; }

// Generic create for entity
function createEntity(entity, obj){
  const d = db();
  d[entity] = d[entity] || [];
  d[entity].push(obj);
  saveDb(d);
}

// Generic delete by key/value
function deleteEntity(entity, keyName, value){
  const d = db();
  d[entity] = (d[entity]||[]).filter(x => x[keyName] !== value);
  saveDb(d);
}

// ----------------------- AUTH -----------------------
function login(email, pass){
  if(email === 'aluno@example.com' && pass === '123'){ sessionStorage.setItem('ci_user', email); return true; }
  const d = db();
  const p = (d.Pessoa||[]).find(x=>x.Email === email);
  if(p && pass === '123'){ sessionStorage.setItem('ci_user', email); return true; }
  return false;
}
function logout(){ sessionStorage.removeItem('ci_user'); document.getElementById('app').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function isAuth(){ return !!sessionStorage.getItem('ci_user'); }

// ----------------------- RENDER: Overview -----------------------
function renderOverview(){
  const d = db();
  const view = document.getElementById('view-area'); view.innerHTML = '';
  const tpl = document.getElementById('tpl-overview').content.cloneNode(true);
  view.appendChild(tpl);

  document.getElementById('stat-paises').textContent = (d.Pais||[]).length;
  document.getElementById('stat-pessoas').textContent = (d.Pessoa||[]).length;
  document.getElementById('stat-invests').textContent = (d.Investimento||[]).length;
  document.getElementById('overviewText').textContent =
    `Clientes: ${(d.Cliente||[]).length}. Carteiras: ${(d.Carteira||[]).length}. Investimentos: ${(d.Investimento||[]).length}.`;

  // ============================
  // 🔧 PIE CHART CORRIGIDO
  // ============================
  const tipos = {};
  const tiposMap = (d.Tipo || []).reduce((acc, t) => {
    acc[t.Id_Tipo] = t.Tipo;
    return acc;
  }, {});

  (d.ItensCarteira || []).forEach(it => {
    const inv = (d.Investimento || []).find(x => x.Id_Investimento === it.Id_Investimento);
    if (!inv) return;
    const label = tiposMap[inv.Id_Tipo] || 'Outro';
    tipos[label] = (tipos[label] || 0) + 1;
  });

  let labels = Object.keys(tipos);
  let values = labels.map(l => tipos[l]);

  // Caso não existam investimentos, cria gráfico "placeholder"
  if (labels.length === 0) {
    labels = ['Nenhum investimento'];
    values = [1];
  }

  const ctx = document.getElementById('overviewPie').getContext('2d');
  if (overviewPieChart) overviewPieChart.destroy();

  overviewPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#ff7a00', '#fb8f24', '#1f2937', '#a3a3a3']
      }]
    }
  });
}

// ----------------------- GENERIC ENTITY RENDERER -----------------------
/* ... (continua igual, sem alterações) */
