// This file contains the JavaScript code for the dashboard functionality. 
// It includes functions for formatting dates, managing local storage, 
// updating the dashboard summary, adding entries and exits, 
// rendering lists, checking due dates, and updating the chart.

function mesAnoFormat(date) {
  const m = date.getMonth() + 1;
  const mm = m < 10 ? "0" + m : m;
  return `${date.getFullYear()}-${mm}`;
}

function mesAnoParaData(str) {
  const [ano, mes] = str.split("-");
  return new Date(ano, parseInt(mes) - 1, 1);
}

function nomeMesAno(date) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return meses[date.getMonth()] + "/" + date.getFullYear();
}

function gerarOpcoesMes() {
  const select = document.getElementById("mesSelector");
  const hoje = new Date();
  select.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const val = mesAnoFormat(d);
    const texto = nomeMesAno(d);
    const option = document.createElement("option");
    option.value = val;
    option.textContent = texto;
    select.appendChild(option);
  }
}

let mesAtual = mesAnoFormat(new Date());
let entradas = [];
let saidas = [];
let grafico;

function carregarDados() {
  entradas = JSON.parse(localStorage.getItem(`entradas-${mesAtual}`)) || [];
  saidas = JSON.parse(localStorage.getItem(`saidas-${mesAtual}`)) || [];
}

function salvarDados() {
  localStorage.setItem(`entradas-${mesAtual}`, JSON.stringify(entradas));
  localStorage.setItem(`saidas-${mesAtual}`, JSON.stringify(saidas));
}

function atualizarResumo() {
  const totalEntradas = entradas.reduce((acc, e) => acc + e.valor, 0);
  const totalSaidas = saidas.reduce((acc, s) => acc + s.valor, 0);
  document.getElementById("totalEntradas").textContent = totalEntradas.toFixed(2);
  document.getElementById("totalSaidas").textContent = totalSaidas.toFixed(2);
  document.getElementById("saldoFinal").textContent = (totalEntradas - totalSaidas).toFixed(2);
  atualizarGrafico();
  verificarVencimentos();
  renderizarListas();
  salvarDados();
}

function adicionarEntrada() {
  const nome = document.getElementById("tipoEntrada").value;
  const valor = parseFloat(document.getElementById("entradaValor").value);
  if (nome && !isNaN(valor)) {
    entradas.push({ nome, valor });
    atualizarResumo();
    document.getElementById("entradaValor").value = "";
  }
}

function adicionarSaida() {
  const nome = document.getElementById("tipoSaida").value;
  const valorTotal = parseFloat(document.getElementById("saidaValor").value);
  const parcelas = parseInt(document.getElementById("saidaParcelas").value) || 1;
  const vencimento = document.getElementById("saidaVencimento").value;

  if (nome && !isNaN(valorTotal)) {
    if (parcelas > 1) {
      const valorMensal = valorTotal / parcelas;
      for (let i = 1; i <= parcelas; i++) {
        const dataParcela = new Date(vencimento);
        dataParcela.setMonth(dataParcela.getMonth() + i - 1);
        const vencimentoFormatado = dataParcela.toISOString().split('T')[0];
        saidas.push({
          nome: `${nome} - Parcela ${i}/${parcelas}`,
          valor: valorMensal,
          parcelas: 1,
          vencimento: vencimentoFormatado
        });
      }
    } else {
      saidas.push({ nome, valor: valorTotal, parcelas: 1, vencimento });
    }
    atualizarResumo();
    document.getElementById("saidaValor").value = "";
    document.getElementById("saidaParcelas").value = "";
    document.getElementById("saidaVencimento").value = "";
  }
}

function renderizarListas() {
  document.getElementById("listaEntradas").innerHTML = entradas.map(e => `<li>${e.nome}: R$ ${e.valor.toFixed(2)}</li>`).join('');
  document.getElementById("listaSaidas").innerHTML = saidas.map(s => `<li>${s.nome}: R$ ${s.valor.toFixed(2)} - Venc: ${s.vencimento}</li>`).join('');
}

function verificarVencimentos() {
  const hoje = new Date();
  const alertas = saidas.filter(s => {
    if (!s.vencimento) return false;
    const venc = new Date(s.vencimento);
    const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= 0;
  });
  document.getElementById("alertasVencimento").innerHTML =
    alertas.map(a => `⚠️ ${a.nome} vence em até 3 dias!`).join('<br>') || '';
}

function atualizarGrafico() {
  const ctx = document.getElementById('graficoGastos');
  if (grafico) grafico.destroy();
  const agrupados = {};
  saidas.forEach(s => {
    agrupados[s.nome] = (agrupados[s.nome] || 0) + s.valor;
  });
  const labels = Object.keys(agrupados);
  const dados = Object.values(agrupados);
  grafico = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Gastos Mensais',
        data: dados,
        backgroundColor: ['#f85149', '#58a6ff', '#8b5cf6', '#f59e0b', '#10b981', '#db2777', '#14b8a6', '#f97316', '#8b5cf6', '#a855f7'],
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: '#c9d1d9' } }
      }
    }
  });
}

function trocarMes() {
  const select = document.getElementById("mesSelector");
  mesAtual = select.value;
  carregarDados();
  atualizarResumo();
}

// Inicialização
gerarOpcoesMes();
document.getElementById("mesSelector").value = mesAtual;
carregarDados();
atualizarResumo();

function verificarParcelas() {
  const tipo = document.getElementById("tipoSaida").value;
  const campo = document.getElementById("campoParcelas");

  if (tipo === "Cartão de Crédito") {
    campo.style.display = "block";
  } else {
    campo.style.display = "none";
    document.getElementById("saidaParcelas").value = "";
  }
}

function limparDados() {
  if (confirm("Tem certeza que deseja apagar todos os dados do mês atual?")) {
    entradas = [];
    saidas = [];
    salvarDados();
    atualizarResumo();
    alert("Todos os dados foram apagados.");
  }
}
