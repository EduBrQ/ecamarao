import jsPDF from 'jspdf';

export interface FeedingData {
  date: string;
  totalRacao: number;
  viveirosAlimentados: number;
  totalViveiros: number;
}

export interface ReportData {
  periodo: {
    inicio: string;
    fim: string;
  };
  totalViveiros: number;
  dados: FeedingData[];
  dataGeracao: Date;
}

export function generateFeedingReportPDF(data: ReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Cores do AquaFarm
  const colors = {
    primary: [0, 102, 204],    // Azul
    secondary: [0, 153, 102],  // Verde
    accent: [255, 153, 0],     // Laranja
    text: [51, 51, 51],        // Cinza escuro
    light: [245, 245, 245]     // Cinza claro
  };

  // Funções auxiliares
  const addText = (text: string, fontSize: number, x: number, y: number, color: number[] = colors.text, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.text(text, x, y);
  };

  const addLine = (y: number) => {
    doc.setDrawColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.line(20, y, pageWidth - 20, y);
  };

  const addSection = (title: string) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    addText(title, 16, 20, yPosition, colors.primary, true);
    yPosition += 10;
    addLine(yPosition);
    yPosition += 15;
  };

  // 1. CAPA DO RELATÓRIO
  addText('AquaFarm', 24, pageWidth / 2, yPosition, colors.primary, true);
  doc.text('Sistema de Gestão Aquícola', pageWidth / 2, yPosition + 8, { align: 'center' });
  
  yPosition += 25;
  addText('RELATÓRIO ANALÍTICO DE ALIMENTAÇÃO', 20, pageWidth / 2, yPosition, colors.text, true);
  doc.text('', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  addText(`Período: ${data.periodo.inicio} — ${data.periodo.fim}`, 12, pageWidth / 2, yPosition);
  doc.text('', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  addText(`Viveiros analisados: ${data.totalViveiros}`, 12, pageWidth / 2, yPosition);
  doc.text('', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  addText(`Relatório gerado em: ${data.dataGeracao.toLocaleDateString('pt-BR')}`, 12, pageWidth / 2, yPosition);
  doc.text('', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  addText('Este relatório apresenta uma análise histórica da distribuição de ração nos viveiros registrados no sistema AquaFarm.', 10, pageWidth / 2, yPosition);
  doc.text('', pageWidth / 2, yPosition, { align: 'center' });

  // Nova página para o conteúdo
  doc.addPage();
  yPosition = 20;

  // 2. RESUMO EXECUTIVO
  addSection('RESUMO EXECUTIVO');

  const diasAnalise = data.dados.length;
  const diasComAlimentacao = data.dados.filter(d => d.totalRacao > 0).length;
  const diasSemAlimentacao = diasAnalise - diasComAlimentacao;
  const totalRacao = data.dados.reduce((sum, d) => sum + d.totalRacao, 0);
  const mediaDiaria = diasComAlimentacao > 0 ? totalRacao / diasComAlimentacao : 0;
  const consistenciaOperacional = diasAnalise > 0 ? (diasComAlimentacao / diasAnalise) * 100 : 0;

  // Métricas em grid
  const metrics = [
    { label: 'Dias analisados:', value: diasAnalise.toString() },
    { label: 'Dias com alimentação:', value: diasComAlimentacao.toString() },
    { label: 'Dias sem alimentação:', value: diasSemAlimentacao.toString() },
    { label: 'Total de ração distribuída:', value: `${totalRacao.toFixed(1)} kg` },
    { label: 'Média diária:', value: `${mediaDiaria.toFixed(1)} kg` },
    { label: 'Consistência operacional:', value: `${consistenciaOperacional.toFixed(0)}%` }
  ];

  metrics.forEach((metric, index) => {
    addText(metric.label, 11, 20, yPosition);
    addText(metric.value, 11, 80, yPosition, colors.secondary, true);
    
    if (index % 2 === 0 && index > 0) {
      yPosition += 8;
    } else if (index % 2 === 1) {
      yPosition += 15;
    }
  });

  // 3. GRÁFICO DE CONSUMO DE RAÇÃO
  addSection('GRÁFICO DE CONSUMO DE RAÇÃO');

  // Criar gráfico de barras simples
  const chartX = 20;
  const chartY = yPosition;
  const chartWidth = pageWidth - 40;
  const chartHeight = 80;
  const maxValue = Math.max(...data.dados.map(d => d.totalRacao));

  // Eixos do gráfico
  doc.setDrawColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.rect(chartX, chartY, chartWidth, chartHeight);

  // Barras do gráfico
  const barWidth = chartWidth / (data.dados.length * 2);
  data.dados.forEach((dado, index) => {
    const barHeight = maxValue > 0 ? (dado.totalRacao / maxValue) * (chartHeight - 10) : 0;
    const barX = chartX + (index * 2 * barWidth) + barWidth / 2;
    const barY = chartY + chartHeight - barHeight - 5;
    
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(barX, barY, barWidth, barHeight, 'F');
    
    // Data no eixo X
    doc.setFontSize(8);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const dataShort = new Date(dado.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    doc.text(dataShort, barX + barWidth / 2, chartY + chartHeight + 5, { align: 'center' });
  });

  yPosition += chartHeight + 20;

  // 4. HISTÓRICO DETALHADO DE ALIMENTAÇÃO
  addSection('HISTÓRICO DETALHADO DE ALIMENTAÇÃO');

  // Cabeçalho da tabela
  const tableHeaders = ['Data', 'Ração total (kg)', 'Viveiros', '%'];
  const tableColWidths = [40, 50, 40, 30];
  let tableX = 20;

  tableHeaders.forEach((header, index) => {
    addText(header, 10, tableX, yPosition, colors.primary, true);
    tableX += tableColWidths[index];
  });

  yPosition += 8;
  addLine(yPosition);
  yPosition += 5;

  // Dados da tabela
  data.dados.filter(d => d.totalRacao > 0).forEach((dado) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }

    tableX = 20;
    const dataFormatada = new Date(dado.date).toLocaleDateString('pt-BR');
    const percentual = dado.totalViveiros > 0 ? (dado.viveirosAlimentados / dado.totalViveiros * 100).toFixed(0) : '0';
    
    addText(dataFormatada, 9, tableX, yPosition);
    tableX += tableColWidths[0];
    
    addText(dado.totalRacao.toFixed(1), 9, tableX, yPosition);
    tableX += tableColWidths[1];
    
    addText(`${dado.viveirosAlimentados}/${dado.totalViveiros}`, 9, tableX, yPosition);
    tableX += tableColWidths[2];
    
    addText(`${percentual}%`, 9, tableX, yPosition);
    tableX += tableColWidths[3];
    
    yPosition += 7;
  });

  // 5. DIAS SEM REGISTRO DE ALIMENTAÇÃO
  yPosition += 10;
  addSection('DIAS SEM REGISTRO DE ALIMENTAÇÃO');

  const diasSemRegistro = data.dados.filter(d => d.totalRacao === 0);
  
  if (diasSemRegistro.length === 0) {
    addText('Todos os dias do período possuem registro de alimentação.', 10, 20, yPosition, colors.secondary);
  } else {
    diasSemRegistro.forEach((dado) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      const dataFormatada = new Date(dado.date).toLocaleDateString('pt-BR');
      addText(dataFormatada, 10, 20, yPosition);
      addText('Nenhum registro encontrado', 10, 60, yPosition, colors.accent);
      yPosition += 8;
    });
  }

  // 6. ANÁLISE DE VARIAÇÃO DE CONSUMO
  yPosition += 10;
  addSection('ANÁLISE DE VARIAÇÃO DE CONSUMO');

  const valoresConsumo = data.dados.filter(d => d.totalRacao > 0).map(d => d.totalRacao);
  let mediaConsumo = 0;
  
  if (valoresConsumo.length > 0) {
    const maiorConsumo = Math.max(...valoresConsumo);
    const menorConsumo = Math.min(...valoresConsumo);
    mediaConsumo = valoresConsumo.reduce((a, b) => a + b, 0) / valoresConsumo.length;
    const variacaoPercentual = mediaConsumo > 0 ? ((maiorConsumo - menorConsumo) / mediaConsumo) * 100 : 0;

    addText(`Maior consumo registrado: ${maiorConsumo.toFixed(1)} kg`, 11, 20, yPosition);
    yPosition += 8;
    addText(`Menor consumo registrado: ${menorConsumo.toFixed(1)} kg`, 11, 20, yPosition);
    yPosition += 8;
    addText(`Variação de consumo: ${variacaoPercentual.toFixed(0)}%`, 11, 20, yPosition);
    yPosition += 10;
    
    addText('Isso pode indicar:', 10, 20, yPosition, colors.text, true);
    yPosition += 6;
    addText('• Mudança de biomassa', 9, 25, yPosition);
    yPosition += 6;
    addText('• Ajuste alimentar', 9, 25, yPosition);
    yPosition += 6;
    addText('• Variação operacional', 9, 25, yPosition);
  }

  // 7. ANÁLISE DE CONSISTÊNCIA OPERACIONAL
  yPosition += 10;
  addSection('ANÁLISE DE CONSISTÊNCIA OPERACIONAL');

  let classificacao = '';
  let classificacaoCor = colors.text;
  
  if (consistenciaOperacional >= 90) {
    classificacao = 'Excelente';
    classificacaoCor = colors.secondary;
  } else if (consistenciaOperacional >= 70) {
    classificacao = 'Boa';
    classificacaoCor = colors.primary;
  } else if (consistenciaOperacional >= 50) {
    classificacao = 'Atenção';
    classificacaoCor = colors.accent;
  } else {
    classificacao = 'Crítico';
    classificacaoCor = [220, 53, 69]; // Vermelho
  }

  addText(`Consistência operacional: ${consistenciaOperacional.toFixed(0)}%`, 12, 20, yPosition);
  yPosition += 8;
  addText(`Classificação: ${classificacao}`, 12, 20, yPosition, classificacaoCor, true);

  // 8. INSIGHTS AUTOMÁTICOS
  yPosition += 15;
  addSection('INSIGHTS AUTOMÁTICOS');

  const insights = [];
  
  if (consistenciaOperacional >= 90) {
    insights.push({ type: 'EXCELENTE', message: 'Alta consistência nos registros de alimentação.', color: colors.secondary });
  }
  
  if (diasSemRegistro.length > 0) {
    insights.push({ type: 'ATENÇÃO', message: 'Existem dias sem registro de ração.', color: colors.accent });
  }
  
  if (valoresConsumo.length > 1) {
    const variacoes = [];
    for (let i = 1; i < valoresConsumo.length; i++) {
      const variacao = Math.abs(valoresConsumo[i] - valoresConsumo[i-1]);
      variacoes.push(variacao);
    }
    const mediaVariacoes = variacoes.reduce((a, b) => a + b, 0) / variacoes.length;
    
    if (mediaVariacoes > mediaConsumo * 0.3) {
      insights.push({ type: 'ALERTA', message: 'Grande variação no volume de ração entre dias consecutivos.', color: [220, 53, 69] });
    }
  }

  insights.forEach((insight) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    
    addText(insight.type, 10, 20, yPosition, insight.color, true);
    yPosition += 6;
    addText(insight.message, 9, 25, yPosition);
    yPosition += 10;
  });

  // 9. RECOMENDAÇÕES OPERACIONAIS
  yPosition += 5;
  addSection('RECOMENDAÇÕES OPERACIONAIS');

  const recomendacoes = [
    'Padronizar o registro diário de alimentação.',
    'Evitar grandes variações no volume de ração.',
    'Monitorar biomassa para ajuste alimentar.'
  ];

  recomendacoes.forEach((rec, index) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    
    addText(`${index + 1}. ${rec}`, 10, 20, yPosition);
    yPosition += 8;
  });

  // 10. RODAPÉ DO RELATÓRIO
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Rodapé
    addText('AquaFarm — Sistema de Gestão Aquícola', 8, pageWidth / 2, pageHeight - 15, colors.text);
    doc.text('', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    addText('Relatório gerado automaticamente', 8, pageWidth / 2, pageHeight - 10, colors.text);
    doc.text('', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    addText(`${data.dataGeracao.toLocaleDateString('pt-BR')} ${data.dataGeracao.toLocaleTimeString('pt-BR')}`, 8, pageWidth / 2, pageHeight - 5, colors.text);
    doc.text('', pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Número da página
    addText(`Página ${i} de ${totalPages}`, 8, pageWidth - 20, pageHeight - 5, colors.text);
  }

  // Download do PDF
  const fileName = `relatorio_alimentacao_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Função para coletar dados do dashboard
export function collectFeedingData(dashboard: any, startDate: Date, endDate: Date): ReportData {
  const dados: FeedingData[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    let totalRacaoDia = 0;
    let viveirosAlimentados = 0;
    
    dashboard.viveiros.forEach((viveiro: any) => {
      const racaoDia = viveiro.racoes?.find((r: any) => normalizeDate(r.data) === normalizeDate(currentDate));
      if (racaoDia) {
        const total = (racaoDia.qntManha || 0) + (racaoDia.qntTarde || 0);
        if (total > 0) {
          totalRacaoDia += total;
          viveirosAlimentados++;
        }
      }
    });
    
    dados.push({
      date: dateStr,
      totalRacao: totalRacaoDia,
      viveirosAlimentados,
      totalViveiros: dashboard.viveiros.length
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    periodo: {
      inicio: startDate.toLocaleDateString('pt-BR'),
      fim: endDate.toLocaleDateString('pt-BR')
    },
    totalViveiros: dashboard.viveiros.length,
    dados,
    dataGeracao: new Date()
  };
}

// Função auxiliar para normalizar datas
function normalizeDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
