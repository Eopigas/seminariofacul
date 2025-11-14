// ----------------------- RENDER: Overview -----------------------
function renderOverview() {
  const d = db();
  const view = document.getElementById('view-area');
  view.innerHTML = '';
  const tpl = document.getElementById('tpl-overview').content.cloneNode(true);
  view.appendChild(tpl);

  // Estatísticas
  document.getElementById('stat-paises').textContent = (d.Pais || []).length;
  document.getElementById('stat-pessoas').textContent = (d.Pessoa || []).length;
  document.getElementById('stat-invests').textContent = (d.Investimento || []).length;
  document.getElementById('overviewText').textContent =
    `Clientes: ${(d.Cliente || []).length}. Carteiras: ${(d.Carteira || []).length}. Investimentos: ${(d.Investimento || []).length}.`;

  // ==========================================================
  //      NOVO GRÁFICO DE PIZZA - por investimento (corrigido)
  // ==========================================================

  const labels = [];
  const values = [];
  const colors = [];

  (d.ItensCarteira || []).forEach(it => {
    const inv = (d.Investimento || []).find(x => x.Id_Investimento === it.Id_Investimento);
    if (!inv) return;

    labels.push(inv.Nome);   // aparece o nome do investimento
    values.push(1);          // cada item conta como 1
    colors.push(getRandomColor()); // cor automática pra cada fatia
  });

  // Fallback caso não tenha nada
  if (labels.length === 0) {
    labels.push('Nenhum investimento');
    values.push(1);
    colors.push('#cccccc');
  }

  const ctx = document.getElementById('overviewPie').getContext('2d');
  if (overviewPieChart) overviewPieChart.destroy();

  overviewPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors
      }]
    },
    plugins: [ChartDataLabels],
    options: {
      plugins: {
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 14 },
          formatter: (value, ctx) => {
            const total = ctx.chart._metasets[0].total;
            const pct = ((value / total) * 100).toFixed(1);
            return pct + '%';
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            color: '#000',
            font: { size: 14 }
          }
        }
      }
    }
  });
}

// Gera cores únicas automaticamente
function getRandomColor() {
  const r = Math.floor(Math.random() * 180);
  const g = Math.floor(Math.random() * 180);
  const b = Math.floor(Math.random() * 180);
  return `rgb(${r}, ${g}, ${b})`;
}
