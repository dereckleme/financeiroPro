// Tabela progressiva INSS 2024
export function calcINSS(salarioBruto: number): number {
  const faixas = [
    { ate: 1412.00,  aliquota: 0.075 },
    { ate: 2666.68,  aliquota: 0.090 },
    { ate: 4000.03,  aliquota: 0.120 },
    { ate: 7786.02,  aliquota: 0.140 },
  ];

  let inss = 0;
  let anterior = 0;

  for (const faixa of faixas) {
    if (salarioBruto <= anterior) break;
    const teto = Math.min(salarioBruto, faixa.ate);
    inss += (teto - anterior) * faixa.aliquota;
    anterior = faixa.ate;
    if (salarioBruto <= faixa.ate) break;
  }

  return Math.round(inss * 100) / 100;
}

// Tabela IRRF 2024
export function calcIR(baseCalculo: number): number {
  const faixas = [
    { ate: 2259.20,  aliquota: 0,      deducao: 0        },
    { ate: 2826.65,  aliquota: 0.075,  deducao: 169.44   },
    { ate: 3751.05,  aliquota: 0.150,  deducao: 381.44   },
    { ate: 4664.68,  aliquota: 0.225,  deducao: 662.77   },
    { ate: Infinity, aliquota: 0.275,  deducao: 896.00   },
  ];

  for (const faixa of faixas) {
    if (baseCalculo <= faixa.ate) {
      return Math.max(0, Math.round((baseCalculo * faixa.aliquota - faixa.deducao) * 100) / 100);
    }
  }
  return 0;
}

export function calcSalarioLiquido(config: {
  salario_bruto: number;
  vr_diario: number;
  dias_uteis: number;
  va_mensal: number;
  vt_mensal: number;
  inss_override: number;
  ir_override: number;
  outros_descontos: number;
}): {
  bruto: number;
  beneficios: number;
  inss: number;
  ir: number;
  outros: number;
  liquido: number;
} {
  const bruto = config.salario_bruto;
  const beneficios = config.vr_diario * config.dias_uteis + config.va_mensal + config.vt_mensal;
  const inss = config.inss_override > 0 ? config.inss_override : calcINSS(bruto);
  const baseIR = Math.max(0, bruto - inss);
  const ir = config.ir_override > 0 ? config.ir_override : calcIR(baseIR);
  const outros = config.outros_descontos;
  const liquido = bruto + beneficios - inss - ir - outros;

  return { bruto, beneficios, inss, ir, outros, liquido };
}

export function proximoPagamento(diaPagamento: number): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  let data = new Date(ano, mes, diaPagamento);
  if (data <= hoje) {
    data = new Date(ano, mes + 1, diaPagamento);
  }
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}
