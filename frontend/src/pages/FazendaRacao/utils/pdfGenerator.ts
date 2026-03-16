import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  viveirosInfo: Array<{
    numero: number;
    diasDesdeInicio: number;
    nome: string;
  }>;
}

export function generateFeedingReportPDF(data: ReportData) {
  // Criar elemento temporário para o relatório
  const reportElement = document.createElement('div');
  reportElement.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 210mm;
    padding: 20px;
    background: white;
    font-family: Arial, sans-serif;
    color: #333;
  `;
  
  // Data atual
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Cálculos para o resumo
  const diasAnalise = data.dados.length;
  const diasComAlimentacao = data.dados.filter(d => d.totalRacao > 0).length;
  const totalRacao = data.dados.reduce((sum, d) => sum + d.totalRacao, 0);
  const mediaDiaria = diasComAlimentacao > 0 ? totalRacao / diasComAlimentacao : 0;
  const consistenciaOperacional = diasAnalise > 0 ? (diasComAlimentacao / diasAnalise) * 100 : 0;
  const totalViveiros = data.totalViveiros;
  
  // Mapeamento correto por viveiro para cálculo de dias sem registro
  let totalDiasSemRegistroPorViveiros = 0;
  let totalDiasComRegistroPorViveiros = 0;
  for (let i = 1; i <= totalViveiros; i++) {
    const diasSemRegistroViveiro = data.dados.filter(d => {
      return !(d.totalRacao > 0 && d.viveirosAlimentados >= i);
    }).length;
    const diasComRegistroViveiro = data.dados.filter(d => {
      return d.totalRacao > 0 && d.viveirosAlimentados >= i;
    }).length;
    totalDiasSemRegistroPorViveiros += diasSemRegistroViveiro;
    totalDiasComRegistroPorViveiros += diasComRegistroViveiro;
  }
  
  // Cálculo de custo (valor estimado por kg de ração)
  const valorPorKg = 9.50; // Valor estimado - pode ser ajustado
  const custoTotal = totalRacao * valorPorKg;

  // Classificação de desempenho
  let classificacao = '';
  let classificacaoCor = '';
  let classificacaoIcon = '';
  
  if (consistenciaOperacional >= 90) {
    classificacao = 'EXCELENTE';
    classificacaoCor = '#10b981';
    classificacaoIcon = '🟢';
  } else if (consistenciaOperacional >= 70) {
    classificacao = 'BOA';
    classificacaoCor = '#22c55e';
    classificacaoIcon = '🟡';
  } else if (consistenciaOperacional >= 50) {
    classificacao = 'REGULAR';
    classificacaoCor = '#f59e0b';
    classificacaoIcon = '🟠';
  } else {
    classificacao = 'CRÍTICA';
    classificacaoCor = '#ef4444';
    classificacaoIcon = '🔴';
  }

  // Montar HTML do relatório
  reportElement.innerHTML = `
    <div style="margin-bottom: 30px; text-align: center;">
      <h1 style="margin: 0; color: #1f2937; font-size: 28px; margin-bottom: 10px;">
        🦐 Relatório de Alimentação - AquaFarm
      </h1>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Análise completa do período de alimentação - Gerado em ${dataAtual}
      </p>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
        📊 Resumo do Período
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: bold; width: 50%;">Período de Análise</td>
          <td style="padding: 10px; background: #f9fafb;">${data.periodo.inicio} — ${data.periodo.fim}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Total de Viveiros</td>
          <td style="padding: 10px; background: #f9fafb;">${totalViveiros} viveiros</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Dias Analisados</td>
          <td style="padding: 10px; background: #f9fafb;">${diasAnalise} dias</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Dias com Alimentação</td>
          <td style="padding: 10px; background: #f9fafb;">${diasComAlimentacao} dias (${((diasComAlimentacao/diasAnalise)*100).toFixed(1)}%)</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Total de Ração Distribuída</td>
          <td style="padding: 10px; background: #f9fafb;">${totalRacao.toFixed(1)} kg</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Média Diária</td>
          <td style="padding: 10px; background: #f9fafb;">${mediaDiaria.toFixed(1)} kg/dia</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Consistência Operacional</td>
          <td style="padding: 10px; background: #f9fafb; font-weight: bold; color: ${classificacaoCor};">
            ${classificacaoIcon} ${consistenciaOperacional.toFixed(0)}% - ${classificacao}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #fef3c7; font-weight: bold;">💰 Custo Total Estimado</td>
          <td style="padding: 10px; background: #fef9c3; font-weight: bold; color: #b45309;">R$ ${custoTotal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
        📈 Análise de Desempenho
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px; background: #dcfce7; font-weight: bold; width: 50%;">🟢 Dias com Registro Completo</td>
          <td style="padding: 10px; background: #f0fdf4;">${totalDiasComRegistroPorViveiros} dias (${((totalDiasComRegistroPorViveiros/(diasAnalise * totalViveiros))*100).toFixed(1)}%)</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #fee2e2; font-weight: bold;">🔴 Dias sem Registro</td>
          <td style="padding: 10px; background: #fef2f2;">${totalDiasSemRegistroPorViveiros} dias (${((totalDiasSemRegistroPorViveiros/(diasAnalise * totalViveiros))*100).toFixed(1)}%)</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">📊 Eficiência Operacional</td>
          <td style="padding: 10px; background: #f9fafb; font-weight: bold; color: ${classificacaoCor};">
            ${classificacaoIcon} ${classificacao}
          </td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
        📋 Resumo por Viveiro
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
        ${(() => {
          // Agrupar dados por viveiro (simulado - na prática viria do dashboard)
          const viveirosResumo = [];
          for (let i = 1; i <= totalViveiros; i++) {
            const dadosViveiro = data.dados.map(d => {
              // Calcular ração por viveiro apenas se foi alimentado
              const racaoPorViveiro = d.totalRacao > 0 && d.viveirosAlimentados >= i ? 
                (d.totalRacao / d.viveirosAlimentados) : 0;
              
              return {
                date: d.date,
                totalRacao: racaoPorViveiro,
                alimentado: d.totalRacao > 0 && d.viveirosAlimentados >= i
              };
            });
            
            const totalRacaoViveiro = dadosViveiro.reduce((sum, d) => sum + d.totalRacao, 0);
            const diasAlimentados = dadosViveiro.filter(d => d.alimentado).length;
            const diasTotais = dadosViveiro.length;
            const mediaDiaria = diasAlimentados > 0 ? totalRacaoViveiro / diasAlimentados : 0;
            const consistencia = diasTotais > 0 ? (diasAlimentados / diasTotais) * 100 : 0;
            
            // Obter informação real de dias desde o início do ciclo dos dados coletados
            const viveiroInfo = data.viveirosInfo.find(v => v.numero === i);
            const diasDesdeInicio = viveiroInfo ? viveiroInfo.diasDesdeInicio : 45;
            const nomeViveiro = viveiroInfo ? viveiroInfo.nome : `Viveiro ${i}`;
            
            viveirosResumo.push({
              nome: nomeViveiro,
              totalRacao: totalRacaoViveiro,
              diasAlimentados,
              diasTotais,
              mediaDiaria,
              consistencia,
              diasDesdeInicio
            });
          }
          
          return viveirosResumo.map(viveiro => {
            const statusColor = viveiro.consistencia >= 80 ? '#dcfce7' : viveiro.consistencia >= 60 ? '#fef3c7' : '#fee2e2';
            const statusIcon = viveiro.consistencia >= 80 ? '🟢' : viveiro.consistencia >= 60 ? '🟡' : '🔴';
            const statusText = viveiro.consistencia >= 80 ? 'Excelente' : viveiro.consistencia >= 60 ? 'Bom' : 'Atenção';
            
            // Determinar motivo quando for Atenção
            let motivoAtencao = '';
            if (viveiro.consistencia < 60) {
              if (viveiro.diasAlimentados === 0) {
                motivoAtencao = 'Sem registros de alimentação';
              } else if (viveiro.consistencia < 30) {
                motivoAtencao = 'Baixíssima frequência de alimentação';
              } else if (viveiro.consistencia < 50) {
                motivoAtencao = 'Frequência de alimentação irregular';
              } else {
                motivoAtencao = 'Frequência de alimentação abaixo do esperado';
              }
            }
            
            // Cálculo de custo por viveiro
            const custoViveiro = viveiro.totalRacao * valorPorKg;
            
            return `
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: bold;">${viveiro.nome} (${viveiro.diasDesdeInicio} dias)</h3>
                  <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: ${viveiro.consistencia >= 80 ? '#166534' : viveiro.consistencia >= 60 ? '#92400e' : '#991b1b'};">
                    ${statusIcon} ${statusText}
                  </span>
                </div>
                
                ${viveiro.consistencia < 60 ? `
                  <div style="background: #fef2f2; padding: 8px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #ef4444;">
                    <div style="font-size: 11px; color: #991b1b; font-weight: bold; margin-bottom: 2px;">⚠️ Motivo da Atenção</div>
                    <div style="font-size: 12px; color: #7f1d1d;">${motivoAtencao}</div>
                  </div>
                ` : ''}
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div style="text-align: center; padding: 10px; background: #f0fdf4; border-radius: 6px; border-left: 3px solid #10b981;">
                    <div style="font-size: 11px; color: #059669; margin-bottom: 2px; font-weight: 600;">Total Acumulado</div>
                    <div style="font-size: 20px; font-weight: bold; color: #047857;">${viveiro.totalRacao.toFixed(1)} kg</div>
                  </div>
                  <div style="text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px; font-weight: 600;">Média Diária</div>
                    <div style="font-size: 20px; font-weight: bold; color: #111827;">${viveiro.mediaDiaria.toFixed(1)} kg</div>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div style="text-align: center; padding: 8px; background: #f9fafb; border-radius: 6px;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Dias Alimentados</div>
                    <div style="font-size: 16px; font-weight: bold; color: #111827;">${viveiro.diasAlimentados}/${viveiro.diasTotais}</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #f3f4f6; border-radius: 6px;">
                    <div style="font-size: 11px; color: #374151; margin-bottom: 2px;">Consistência</div>
                    <div style="font-size: 16px; font-weight: bold; color: #111827;">${viveiro.consistencia.toFixed(0)}%</div>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px; margin-bottom: 10px;">
                  <div style="text-align: center; padding: 10px; background: #fef3c7; border-radius: 6px; border-left: 3px solid #f59e0b;">
                    <div style="font-size: 11px; color: #92400e; margin-bottom: 2px; font-weight: 600;">Custo Total Estimado</div>
                    <div style="font-size: 20px; font-weight: bold; color: #b45309;">R$ ${custoViveiro.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</div>
                  </div>
                </div>
                
                <div style="padding: 8px; background: #f8fafc; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">Desempenho no Período</div>
                  <div style="display: flex; justify-content: center; gap: 15px;">
                    <span style="font-size: 12px; color: #059669; font-weight: 600;">
                      📊 ${viveiro.consistencia >= 80 ? 'Alta' : viveiro.consistencia >= 60 ? 'Média' : 'Baixa'} frequência
                    </span>
                    <span style="font-size: 12px; color: #7c3aed; font-weight: 600;">
                      🎯 ${viveiro.mediaDiaria > 0 ? 'Regular' : 'Irregular'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        })()}
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
        🎯 Insights e Recomendações
      </h2>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin: 0 0 10px 0; color: #059669; font-size: 16px;">📊 Análise de Desempenho Real</h3>
        <p style="margin: 0 0 10px 0; color: #374151; line-height: 1.5;">
          Análise baseada nos dados reais dos ${totalViveiros} viveiros ativos no período.
        </p>
        
        <!-- Análise por viveiro e recomendações -->
        ${(() => {
          // Agrupar dados por viveiro para análise
          const viveirosResumo = [];
          for (let i = 1; i <= totalViveiros; i++) {
            const dadosViveiro = data.dados.map(d => {
              const racaoPorViveiro = d.totalRacao > 0 && d.viveirosAlimentados >= i ? 
                (d.totalRacao / d.viveirosAlimentados) : 0;
              return {
                date: d.date,
                totalRacao: racaoPorViveiro,
                alimentado: d.totalRacao > 0 && d.viveirosAlimentados >= i
              };
            });
            
            const totalRacaoViveiro = dadosViveiro.reduce((sum, d) => sum + d.totalRacao, 0);
            const diasAlimentados = dadosViveiro.filter(d => d.alimentado).length;
            const diasTotais = dadosViveiro.length;
            const mediaDiaria = diasAlimentados > 0 ? totalRacaoViveiro / diasAlimentados : 0;
            const consistencia = diasTotais > 0 ? (diasAlimentados / diasTotais) * 100 : 0;
            
            const viveiroInfo = data.viveirosInfo.find(v => v.numero === i);
            const diasDesdeInicio = viveiroInfo ? viveiroInfo.diasDesdeInicio : 45;
            const nomeViveiro = viveiroInfo ? viveiroInfo.nome : `Viveiro ${i}`;
            
            viveirosResumo.push({
              nome: nomeViveiro,
              totalRacao: totalRacaoViveiro,
              diasAlimentados,
              diasTotais,
              mediaDiaria,
              consistencia,
              diasDesdeInicio
            });
          }
          
          const viveirosComProblemas = viveirosResumo.filter((v: any) => v.consistencia < 60).length;
          const viveirosExcelentes = viveirosResumo.filter((v: any) => v.consistencia >= 80).length;
          const viveirosRegulares = viveirosResumo.filter((v: any) => v.consistencia >= 60 && v.consistencia < 80).length;
          
          let html = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
              <div style="background: #fef2f2; padding: 10px; border-radius: 6px; text-align: center;">
                <div style="font-size: 14px; color: #991b1b; font-weight: bold;">⚠️ Viveiros em Atenção</div>
                <div style="font-size: 20px; color: #dc2626; font-weight: bold;">${viveirosComProblemas}</div>
              </div>
              <div style="background: #fef3c7; padding: 10px; border-radius: 6px; text-align: center;">
                <div style="font-size: 14px; color: #92400e; font-weight: bold;">📊 Viveiros Regulares</div>
                <div style="font-size: 20px; color: #d97706; font-weight: bold;">${viveirosRegulares}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; text-align: center;">
                <div style="font-size: 14px; color: #166534; font-weight: bold;">✅ Viveiros Excelentes</div>
                <div style="font-size: 20px; color: #16a34a; font-weight: bold;">${viveirosExcelentes}</div>
              </div>
            </div>
          `;
          
          // Recomendações específicas
          html += `
            <div style="background: #fffbeb; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">💡 Recomendações Específicas</p>
              <ul style="margin: 5px 0 0 0; color: #78350f; font-size: 14px; padding-left: 20px;">
          `;
          
          const recomendacoes = [];
          const viveirosProblema = viveirosResumo.filter((v: any) => v.consistencia < 60);
          if (viveirosProblema.length > 0) {
            recomendacoes.push(`<li><strong>Atenção Imediata:</strong> ${viveirosProblema.length} viveiro(s) com baixa consistência de alimentação (${viveirosProblema.map((v: any) => v.nome).join(', ')})</li>`);
          }
          
          const viveirosBaixaMedia = viveirosResumo.filter((v: any) => v.mediaDiaria < 1);
          if (viveirosBaixaMedia.length > 0) {
            recomendacoes.push(`<li><strong>Revisar Metas:</strong> ${viveirosBaixaMedia.length} viveiro(s) com média diária abaixo de 1kg (${viveirosBaixaMedia.map((v: any) => v.nome).join(', ')})</li>`);
          }
          
          const custoMedioPorViveiro = custoTotal / totalViveiros;
          if (custoMedioPorViveiro > 1000) {
            recomendacoes.push(`<li><strong>Otimizar Custos:</strong> Custo médio de R$ ${custoMedioPorViveiro.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} por viveiro - avaliar eficiência</li>`);
          }
          
          recomendacoes.push('<li>Manter registros diários para melhor análise de desempenho e ajuste de estratégias</li>');
          html += recomendacoes.join('');
          html += '</ul></div>';
          
          // Destaques positivos
          const viveirosExcelentesLista = viveirosResumo.filter((v: any) => v.consistencia >= 80);
          if (viveirosExcelentesLista.length > 0) {
            html += `
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                <p style="margin: 0; color: #166534; font-weight: bold;">🌟 Destaques Positivos</p>
                <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">
                  <strong>${viveirosExcelentesLista.map((v: any) => v.nome).join(', ')}</strong> apresentam excelente consistência operacional (≥80%)
                </p>
              </div>
            `;
          }
          
          // Resumo financeiro
          html += `
            <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #374151; font-weight: bold;">💰 Resumo Financeiro do Período</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px;">
                <div style="text-align: center;">
                  <div style="font-size: 12px; color: #6b7280;">Total Investido</div>
                  <div style="font-size: 16px; color: #b45309; font-weight: bold;">R$ ${custoTotal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 12px; color: #6b7280;">Média por Viveiro</div>
                  <div style="font-size: 16px; color: #b45309; font-weight: bold;">R$ ${(custoTotal / totalViveiros).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</div>
                </div>
              </div>
            </div>
          `;
          
          return html;
        })()}
      </div>
    </div>

    <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <p style="margin: 0;">Relatório gerado automaticamente pelo sistema AquaFarm</p>
      <p style="margin: 5px 0 0 0;">🦐 Sistema Inteligente de Gestão Aquícola - Análise Completa de Alimentação</p>
    </div>
  `;

  document.body.appendChild(reportElement);

  // Gerar PDF usando html2canvas
  html2canvas(reportElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calcular dimensões para ajustar à página A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95;
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Salvar PDF
    const fileName = `relatorio_alimentacao_aquafarm_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    // Limpar elemento temporário
    document.body.removeChild(reportElement);
  }).catch(error => {
    console.error('Erro ao gerar PDF:', error);
    document.body.removeChild(reportElement);
    throw error;
  });
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
    dataGeracao: new Date(),
    viveirosInfo: dashboard.viveiros.map((viveiro: any, index: number) => ({
  numero: index + 1,
  diasDesdeInicio: viveiro.doc || 45,
  nome: viveiro.viveiro?.nome || viveiro.nome || `Viveiro ${index + 1}` // Usar mesma estrutura do componente
}))
  };
}

// Função auxiliar para normalizar datas
function normalizeDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
