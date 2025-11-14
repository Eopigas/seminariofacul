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
    Investimento: [{Id_Investimento:1, Id_Tipo:1, Id_Risco:2, Nome:'VALE3', Rentabilidade_Prevista:0.12, Descricao:'Ação Demo'}, {Id_Investimento:2, Id_Tipo:2, Id_Risco:1, Nome:'Bitcoin', Rentabilidade_Prevista:0.2, Descricao:'Cripto Demo'}],
    ItensCarteira: [{Id_Carteira:1, Id_Investimento:1, Data_Aquisicao:now},{Id_Carteira:1, Id_Investimento:2, Data_Aquisicao:now}],
    Orientacao: [],
    ItensOrientacao: []
  };
  localStorage.setItem(APP_KEY, JSON.stringify(data));
}

// ----------------------- DB HELPERS -----------------------
function db(){ return JSON.parse(localStorage.getItem(APP_KEY) || '{}'); }
function saveDb(d){ localStorage.setItem(APP_KEY, JSON.stringify(d)); }
function nextId(arr, key){ return (arr && arr.reduce((m,x)=>Math.max(m, x[key]||0),0) || 0) + 1; }

// Generic create for entity (obj keys must match)
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

// ----------------------- AUTH (simple) -----------------------
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
  document.getElementById('overviewText').textContent = `Clientes: ${(d.Cliente||[]).length}. Carteiras: ${(d.Carteira||[]).length}. Investimentos: ${(d.Investimento||[]).length}.`;

  // pie by Tipo using ItensCarteira counts
  const tipos = {};
  const tiposMap = (d.Tipo||[]).reduce((a,t)=>{ a[t.Id_Tipo] = t.Tipo; return a; }, {});
  (d.ItensCarteira||[]).forEach(it=>{
    const inv = (d.Investimento||[]).find(x=>x.Id_Investimento === it.Id_Investimento);
    if(!inv) return;
    const label = tiposMap[inv.Id_Tipo] || 'Outro';
    tipos[label] = (tipos[label]||0) + 1;
  });
  const labels = Object.keys(tipos);
  const values = labels.map(l => tipos[l]);

  const ctx = document.getElementById('overviewPie').getContext('2d');
  if(overviewPieChart) overviewPieChart.destroy();
  overviewPieChart = new Chart(ctx, { type:'pie', data:{ labels, datasets:[{ data: values, backgroundColor:['#ff7a00','#fb8f24','#1f2937','#a3a3a3'] }] }});
}

// ----------------------- GENERIC ENTITY RENDERER -----------------------
/*
 This renderer accepts a descriptor object with:
  - entity: name (string)
  - fields: [ {name:'Id_Pais', label:'Id', type:'number'|'text'|'select', fk:{entity:'Pais', key:'Id_Pais', labelKey:'Nome'} } , ... ]
*/
function renderEntityScreen(descriptor){
  requireAuthForView();
  const view = document.getElementById('view-area'); view.innerHTML = '';
  const tpl = document.getElementById('tpl-entity').content.cloneNode(true);
  view.appendChild(tpl);

  document.getElementById('entityTitle').textContent = descriptor.entity;

  const formDiv = document.getElementById('entityForm');
  formDiv.innerHTML = '';
  const tableDiv = document.getElementById('entityTable');
  tableDiv.innerHTML = '';

  // Build form
  const form = document.createElement('div');
  descriptor.fields.forEach(field=>{
    const row = document.createElement('div');
    row.className = 'form-row';
    const label = document.createElement('label');
    label.textContent = field.label || field.name;
    row.appendChild(label);

    if(field.type === 'select'){
      const sel = document.createElement('select');
      sel.id = 'f_' + field.name;
      // populate options from fk
      const options = (db()[field.fk.entity]||[]);
      const opt0 = document.createElement('option'); opt0.value=''; opt0.textContent='(selecione)'; sel.appendChild(opt0);
      options.forEach(o=>{
        const opt = document.createElement('option'); opt.value = o[field.fk.key]; opt.textContent = o[field.fk.labelKey] || o[field.fk.key];
        sel.appendChild(opt);
      });
      row.appendChild(sel);
    } else if(field.type === 'textarea'){
      const ta = document.createElement('textarea'); ta.id = 'f_' + field.name; row.appendChild(ta);
    } else {
      const inp = document.createElement('input'); inp.id = 'f_' + field.name; inp.type = field.type || 'text'; row.appendChild(inp);
    }
    form.appendChild(row);
  });

  const addBtn = document.createElement('button'); addBtn.className='btn primary'; addBtn.textContent = 'Adicionar';
  addBtn.onclick = () => {
    const d = db();
    // create object with fields (detect PK)
    const obj = {};
    descriptor.fields.forEach(f=>{
      const el = document.getElementById('f_' + f.name);
      if(!el) return;
      let val = el.value;
      if(f.type === 'number') val = Number(val) || 0;
      if(f.type === 'select') val = Number(val) || null;
      obj[f.name] = val;
    });
    // fill PK if missing
    const pkField = descriptor.pk;
    if(pkField && (!obj[pkField] || obj[pkField] === 0)){
      d[descriptor.entity] = d[descriptor.entity] || [];
      const next = nextId(d[descriptor.entity], pkField);
      obj[pkField] = next;
    }
    d[descriptor.entity] = d[descriptor.entity] || [];
    d[descriptor.entity].push(obj);
    saveDb(d);
    renderEntityScreen(descriptor);
  };
  form.appendChild(addBtn);

  formDiv.appendChild(form);

  // Build table
  const arr = db()[descriptor.entity] || [];
  const table = document.createElement('table'); table.className='table';
  const thead = document.createElement('thead'); const htr = document.createElement('tr');
  descriptor.fields.forEach(f => { const th = document.createElement('th'); th.textContent = f.label || f.name; htr.appendChild(th); });
  htr.appendChild(document.createElement('th')).textContent = 'Ações';
  thead.appendChild(htr); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  arr.forEach(rowObj=>{
    const tr = document.createElement('tr');
    descriptor.fields.forEach(f=>{
      const td = document.createElement('td');
      let v = rowObj[f.name];
      if(f.type === 'select' && f.fk){
        const fkArr = db()[f.fk.entity] || [];
        const fkObj = fkArr.find(x => x[f.fk.key] == v) || {};
        v = fkObj[f.fk.labelKey] || v;
      }
      td.textContent = v === undefined ? '' : v;
      tr.appendChild(td);
    });
    const tdAct = document.createElement('td');
    const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Remover';
    del.onclick = ()=>{ if(confirm('Remover?')){ deleteEntity(descriptor.entity, descriptor.pk, rowObj[descriptor.pk]); renderEntityScreen(descriptor); } };
    tdAct.appendChild(del);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableDiv.appendChild(table);
}

// ----------------------- ENTITY DESCRIPTORS -----------------------
const ENTITIES = {
  Pais: {
    entity:'Pais', pk:'Id_Pais',
    fields:[
      {name:'Id_Pais', label:'ID', type:'number'},
      {name:'Nome', label:'Nome', type:'text'}
    ]
  },
  Estado: {
    entity:'Estado', pk:'Id_Estado',
    fields:[
      {name:'Id_Estado', label:'ID', type:'number'},
      {name:'Id_Pais', label:'País', type:'select', fk:{entity:'Pais', key:'Id_Pais', labelKey:'Nome'}},
      {name:'Nome', label:'Nome', type:'text'}
    ]
  },
  Endereco: {
    entity:'Endereco', pk:'Id_Endereco',
    fields:[
      {name:'Id_Endereco', label:'ID', type:'number'},
      {name:'Id_Estado', label:'Estado', type:'select', fk:{entity:'Estado', key:'Id_Estado', labelKey:'Nome'}}
    ]
  },
  Pessoa:{
    entity:'Pessoa', pk:'Id_Pessoa',
    fields:[
      {name:'Id_Pessoa', label:'ID', type:'number'},
      {name:'Id_Endereco', label:'Endereço', type:'select', fk:{entity:'Endereco', key:'Id_Endereco', labelKey:'Id_Endereco'}},
      {name:'Nome', label:'Nome', type:'text'},
      {name:'Sobrenome', label:'Sobrenome', type:'text'},
      {name:'Email', label:'Email', type:'text'},
      {name:'Sexo', label:'Sexo', type:'text'},
      {name:'Telefone', label:'Telefone', type:'text'},
      {name:'Data_Nascimento', label:'Data Nasc', type:'text'}
    ]
  },
  Departamento:{ entity:'Departamento', pk:'Id_Departamento', fields:[{name:'Id_Departamento', label:'ID', type:'number'},{name:'Nome', label:'Nome', type:'text'}] },
  Cargo:{ entity:'Cargo', pk:'Id_Cargo', fields:[{name:'Id_Cargo', label:'ID', type:'number'},{name:'Nome', label:'Nome', type:'text'},{name:'Salario_Base', label:'Salário Base', type:'number'}] },
  Contrato:{ entity:'Contrato', pk:'Id_Contrato', fields:[{name:'Id_Contrato', label:'ID', type:'number'},{name:'Id_Departamento', label:'Departamento', type:'select', fk:{entity:'Departamento', key:'Id_Departamento', labelKey:'Nome'}},{name:'Id_Cargo', label:'Cargo', type:'select', fk:{entity:'Cargo', key:'Id_Cargo', labelKey:'Nome'}},{name:'Data_Contrato', label:'Data Contrato', type:'text'}] },
  Status:{ entity:'Status', pk:'Id_Status', fields:[{name:'Id_Status', label:'ID', type:'number'},{name:'Status', label:'Status', type:'text'},{name:'Data_Atribuicao', label:'Data', type:'text'}] },
  Funcionario:{ entity:'Funcionario', pk:'Id_Funcionario', fields:[{name:'Id_Funcionario', label:'ID', type:'number'},{name:'Id_Pessoa', label:'Pessoa', type:'select', fk:{entity:'Pessoa', key:'Id_Pessoa', labelKey:'Nome'}},{name:'Id_Contrato', label:'Contrato', type:'select', fk:{entity:'Contrato', key:'Id_Contrato', labelKey:'Id_Contrato'}},{name:'Id_Status', label:'Status', type:'select', fk:{entity:'Status', key:'Id_Status', labelKey:'Status'}}] },
  Bonus:{ entity:'Bonus', pk:'Id_Bonus', fields:[{name:'Id_Bonus', label:'ID', type:'number'},{name:'Id_Funcionario', label:'Funcionário', type:'select', fk:{entity:'Funcionario', key:'Id_Funcionario', labelKey:'Id_Funcionario'}},{name:'Valor', label:'Valor', type:'number'},{name:'Data_Atribuicao', label:'Data', type:'text'},{name:'Descricao', label:'Descrição', type:'text'}] },
  Situacao:{ entity:'Situacao', pk:'Id_Situacao', fields:[{name:'Id_Situacao', label:'ID', type:'number'},{name:'Situacao', label:'Situação', type:'text'},{name:'Data_Atribuicao', label:'Data', type:'text'},{name:'Descricao', label:'Descrição', type:'text'}] },
  Consultor:{ entity:'Consultor', pk:'Id_Consultor', fields:[{name:'Id_Consultor', label:'ID', type:'number'},{name:'Id_Funcionario', label:'Funcionário', type:'select', fk:{entity:'Funcionario', key:'Id_Funcionario', labelKey:'Id_Funcionario'}},{name:'Id_Situacao', label:'Situação', type:'select', fk:{entity:'Situacao', key:'Id_Situacao', labelKey:'Situacao'}},{name:'Descricao', label:'Descrição', type:'text'}] },
  Perfil:{ entity:'Perfil', pk:'Id_Perfil', fields:[{name:'Id_Perfil', label:'ID', type:'number'},{name:'Perfil', label:'Perfil', type:'text'}] },
  Cliente:{ entity:'Cliente', pk:'Id_Cliente', fields:[{name:'Id_Cliente', label:'ID', type:'number'},{name:'Id_Pessoa', label:'Pessoa', type:'select', fk:{entity:'Pessoa', key:'Id_Pessoa', labelKey:'Nome'}},{name:'Id_Perfil', label:'Perfil', type:'select', fk:{entity:'Perfil', key:'Id_Perfil', labelKey:'Perfil'}},{name:'Data_Registro', label:'Data Registro', type:'text'}] },
  PessoaFisica:{ entity:'PessoaFisica', pk:'Id_Cliente', fields:[{name:'Id_Cliente', label:'ID Cliente', type:'number'},{name:'CPF', label:'CPF', type:'text'}] },
  PessoaJuridica:{ entity:'PessoaJuridica', pk:'Id_Cliente', fields:[{name:'Id_Cliente', label:'ID Cliente', type:'number'},{name:'CNPJ', label:'CNPJ', type:'text'},{name:'Razao_Social', label:'Razão Social', type:'text'}] },
  Carteira:{ entity:'Carteira', pk:'Id_Carteira', fields:[{name:'Id_Carteira', label:'ID', type:'number'},{name:'Id_Cliente', label:'Cliente', type:'select', fk:{entity:'Cliente', key:'Id_Cliente', labelKey:'Id_Cliente'}},{name:'Nome', label:'Nome', type:'text'},{name:'Data_Criacao', label:'Data Criação', type:'text'}] },
  Risco:{ entity:'Risco', pk:'Id_Risco', fields:[{name:'Id_Risco', label:'ID', type:'number'},{name:'Risco', label:'Risco', type:'text'}] },
  Tipo:{ entity:'Tipo', pk:'Id_Tipo', fields:[{name:'Id_Tipo', label:'ID', type:'number'},{name:'Tipo', label:'Tipo', type:'text'}] },
  Investimento:{ entity:'Investimento', pk:'Id_Investimento', fields:[{name:'Id_Investimento', label:'ID', type:'number'},{name:'Id_Tipo', label:'Tipo', type:'select', fk:{entity:'Tipo', key:'Id_Tipo', labelKey:'Tipo'}},{name:'Id_Risco', label:'Risco', type:'select', fk:{entity:'Risco', key:'Id_Risco', labelKey:'Risco'}},{name:'Nome', label:'Nome', type:'text'},{name:'Rentabilidade_Prevista', label:'Rentabilidade', type:'number'},{name:'Descricao', label:'Descrição', type:'text'}] },
  ItensCarteira:{ entity:'ItensCarteira', pk:'Id_Carteira', fields:[{name:'Id_Carteira', label:'Carteira', type:'select', fk:{entity:'Carteira', key:'Id_Carteira', labelKey:'Nome'}},{name:'Id_Investimento', label:'Investimento', type:'select', fk:{entity:'Investimento', key:'Id_Investimento', labelKey:'Nome'}},{name:'Data_Aquisicao', label:'Data Aquisição', type:'text'}] },
  Orientacao:{ entity:'Orientacao', pk:'Id_Orientacao', fields:[{name:'Id_Orientacao', label:'ID', type:'number'},{name:'Id_Cliente', label:'Cliente', type:'select', fk:{entity:'Cliente', key:'Id_Cliente', labelKey:'Id_Cliente'}},{name:'Id_Consultor', label:'Consultor', type:'select', fk:{entity:'Consultor', key:'Id_Consultor', labelKey:'Id_Consultor'}},{name:'Data_Orientacao', label:'Data', type:'text'},{name:'Objetivo_Orientacao', label:'Objetivo', type:'text'},{name:'Status', label:'Status', type:'text'}] },
  ItensOrientacao:{ entity:'ItensOrientacao', pk:'Id_Orientacao', fields:[{name:'Id_Orientacao', label:'Orientação', type:'select', fk:{entity:'Orientacao', key:'Id_Orientacao', labelKey:'Id_Orientacao'}},{name:'Id_Investimento', label:'Investimento', type:'select', fk:{entity:'Investimento', key:'Id_Investimento', labelKey:'Nome'}},{name:'Valor_Recomendado', label:'Valor Recomendado', type:'number'},{name:'Justificativa', label:'Justificativa', type:'text'}] }
};

// ----------------------- NAVIGATION -----------------------
function requireAuthForView(){ if(!isAuth()){ alert('Sessão expirada — faça login'); document.getElementById('app').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); } }
function navigateToRoute(route){
  // highlight nav btn
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.nav-btn')).find(x=>x.dataset.route === route);
  if(btn) btn.classList.add('active');

  // special: overview & chat
  if(route === 'overview'){ renderOverview(); return; }
  if(route === 'Chat' || route === 'chat'){ renderChat(); return; }

  // entity page
  const desc = ENTITIES[route];
  if(desc){ renderEntityScreen(desc); return; }

  // if unknown
  document.getElementById('view-area').innerHTML = '<div class="card">Rota não encontrada</div>';
}

// ----------------------- CHAT -----------------------
const QUICK_PHRASES = ['Olá','Meus investimentos','Risco','Quero orientação'];
function renderChat(){
  requireAuthForView();
  const view = document.getElementById('view-area'); view.innerHTML = '';
  const tpl = document.getElementById('tpl-chat').content.cloneNode(true);
  view.appendChild(tpl);

  const qbox = document.getElementById('quick-btns');
  QUICK_PHRASES.forEach(p=>{
    const b = document.createElement('button'); b.className='quick-btn'; b.textContent=p; b.onclick=()=> sendChat(p);
    qbox.appendChild(b);
  });

  document.getElementById('chat-send').onclick = ()=>{
    const v = document.getElementById('chat-input').value.trim();
    if(!v) return;
    sendChat(v);
    document.getElementById('chat-input').value = '';
  };
}
function sendChat(text){
  const history = document.getElementById('chat-history');
  const userHtml = `<div class="msg user"><div class="bubble">${escapeHtml(text)}</div></div>`;
  history.innerHTML += userHtml;
  history.scrollTop = history.scrollHeight;
  // very simple bot rules
  const t = text.toLowerCase();
  let reply = 'Desculpe, não entendi. Pergunte sobre investimentos, risco ou carteira.';
  if(t.includes('invest')) reply = 'Você possui ' + (db().ItensCarteira||[]).length + ' itens na carteira.';
  if(t.includes('risco')) reply = 'Riscos disponíveis: ' + (db().Risco||[]).map(r=>r.Risco).join(', ');
  if(t.includes('orient')) reply = 'Agende uma orientação com nossos consultores.';
  setTimeout(()=>{ history.innerHTML += `<div class="msg bot"><div class="bubble">${reply}</div></div>`; history.scrollTop = history.scrollHeight; }, 300);
}

// ----------------------- UTILS -----------------------
function escapeHtml(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// ----------------------- APP INIT -----------------------
function initApp(){
  seedIfEmpty();

  // login
  document.getElementById('btn-login').onclick = ()=>{
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if(login(email, pass)){
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      navigateToRoute('overview');
    } else {
      document.getElementById('login-error').textContent = 'Credenciais inválidas';
    }
  };

  // logout
  document.getElementById('btn-logout').onclick = ()=>{
    logout();
  };

  // nav buttons
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.addEventListener('click', e=>{
      const route = e.currentTarget.dataset.route;
      navigateToRoute(route);
    });
  });

  // export CSV (simple)
  document.getElementById('btn-export').onclick = ()=>{
    const d = db();
    const csvParts = [];
    Object.keys(d).forEach(k=>{
      csvParts.push(`-- ${k} --`);
      const rows = d[k];
      if(Array.isArray(rows) && rows.length){
        const headers = Object.keys(rows[0]);
        csvParts.push(headers.join(','));
        rows.forEach(r=>{
          csvParts.push(headers.map(h=>JSON.stringify(r[h]||'')).join(','));
        });
      } else {
        csvParts.push('(vazio)');
      }
      csvParts.push('');
    });
    const blob = new Blob([csvParts.join('\n')], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ci_data_export.txt'; a.click(); URL.revokeObjectURL(url);
  };
}

// ----------------------- START -----------------------
document.addEventListener('DOMContentLoaded', initApp);
