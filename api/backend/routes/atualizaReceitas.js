import db from '../database/connection.js';

const CONFIG = {
  DIAS_NO_MES: 30,
  FALLBACK_UNIDADE: 1,
  PRECISAO_CALCULOS: 3,
  PRECISAO_EXIBICAO: 2
};

const FATORES_CONVERSAO = {
  massa: { kg: 1000, hg: 100, dag: 10, g: 1, dg: 0.1, cg: 0.01, mg: 0.001 },
  volume: { kl: 1000000, hl: 100000, dal: 10000, l: 1000, dl: 100, cl: 10, ml: 1 },
  contavel: { un: 1, unidade: 1, unidades: 1 }
};

// 1. Função para obter o fator de conversão de uma unidade para a unidade base (g, ml, un)

function obterFatorConversao(unidade) {
  if (!unidade) return CONFIG.FALLBACK_UNIDADE;
  const u = unidade.toLowerCase().trim();
  for (const categoria of Object.values(FATORES_CONVERSAO)) {
    if (categoria[u] !== undefined) return categoria[u];
  }
  return CONFIG.FALLBACK_UNIDADE;
}

// 2. Função para detectar a categoria da unidade (massa, volume, contável)

function detectarCategoria(unidade) {
  if (!unidade) return null;
  const u = unidade.toLowerCase().trim();
  if (FATORES_CONVERSAO.massa[u]) return 'massa';
  if (FATORES_CONVERSAO.volume[u]) return 'volume';
  if (FATORES_CONVERSAO.contavel[u]) return 'contavel';
  return null;
}

// 3. Função para converter uma quantidade de uma unidade para outra

function converterQuantidade(quantidade, unidadeOrigem, unidadeDestino) {
  if (quantidade === undefined || quantidade === null) return 0;
  const fatorOrigem = obterFatorConversao(unidadeOrigem);
  const fatorDestino = obterFatorConversao(unidadeDestino);
  const quantidadeNum = Number(quantidade);
  if (isNaN(quantidadeNum)) return 0;
  return (quantidadeNum * fatorOrigem) / fatorDestino;
}

function calcularCustoIngrediente(custoUnitario, quantidadeConvertida, indiceDesperdicio = 0) {
  const custoBase = custoUnitario * quantidadeConvertida;
  const fatorDesperdicio = 1 + (indiceDesperdicio / 100);
  return custoBase * fatorDesperdicio;
}

function calcularCustoOperacionalPorMinuto(despesas) {
  if (!Array.isArray(despesas) || despesas.length === 0) return 0;
  return despesas.reduce((total, despesa) => {
    const custoMensal = Number(despesa.Custo_Mensal) || 0;
    const tempoDia = Number(despesa.Tempo_Operacional) || 0;

    if (tempoDia > 0 && custoMensal > 0) {
      const custoDiario = custoMensal / 30;
      const custoHora = custoDiario / tempoDia;
      const custoMinuto = custoHora / 60;
      return total + custoMinuto;
    }
    return total;
  }, 0);
}


const despesasCache = new Map();
async function obterDespesasUsuario(ID_Usuario) {
  if (despesasCache.has(ID_Usuario)) {
    return despesasCache.get(ID_Usuario);
  }

  const [despesas] = await db.query(
    `SELECT Custo_Mensal, Tempo_Operacional FROM despesas WHERE ID_Usuario = ?`,
    [ID_Usuario]
  );

  despesasCache.set(ID_Usuario, despesas);
  return despesas;
}

function validarParametros(ID_Receita, ID_Usuario, porcentagemDeLucro, tempoPreparo) {
  if (!ID_Receita) throw new Error('ID_Receita é obrigatório');
  if (!ID_Usuario) throw new Error('ID_Usuario é obrigatório');
  if (porcentagemDeLucro < 0 || porcentagemDeLucro > 1000) {
    throw new Error('Porcentagem de lucro deve estar entre 0 e 1000');
  }
  if (tempoPreparo < 0) {
    throw new Error('Tempo de preparo não pode ser negativo');
  }
}

export async function calculaPrecoReceitaCompleto(ID_Receita, ID_Usuario, porcentagemDeLucro = 0, tempoPreparo = 0) {
  try {
    const lucroSeguro = Number(porcentagemDeLucro) || 0;
    const tempoSeguro = Number(tempoPreparo) || 0;

    validarParametros(ID_Receita, ID_Usuario, lucroSeguro, tempoSeguro);

    const [ingredientes] = await db.query(`
      SELECT 
        ir.Quantidade_Utilizada,
        ir.Unidade_De_Medida AS Unidade_Usada,
        i.ID_Ingredientes,
        i.Nome_Ingrediente,
        i.Indice_de_Desperdicio,
        i.Unidade_De_Medida AS Unidade_Custo,
        p.Custo_Unitario
      FROM ingredientes_receita ir
      JOIN ingredientes i ON ir.ID_Ingredientes = i.ID_Ingredientes
      JOIN (
        SELECT p1.ID_Ingrediente, p1.Custo_Unitario
        FROM preco p1
        INNER JOIN (
          SELECT ID_Ingrediente, MAX(ID) as MaxID
          FROM preco
          GROUP BY ID_Ingrediente
        ) p2 ON p1.ID = p2.MaxID
      ) p ON p.ID_Ingrediente = i.ID_Ingredientes
      WHERE ir.ID_Receita = ?`,
      [ID_Receita]
    );

    if (!ingredientes.length) {
      throw new Error('Nenhum ingrediente encontrado para esta receita');
    }

    let custoIngredientes = 0;

    console.log('==== INÍCIO DO CÁLCULO DA RECEITA ====');
    console.log(`ID_Receita: ${ID_Receita}, ID_Usuario: ${ID_Usuario}`);
    console.log(`Margem de lucro (%): ${porcentagemDeLucro}`);
    console.log(`Tempo de preparo (min): ${tempoPreparo}`);

    for (const ing of ingredientes) {
      const categoria = detectarCategoria(ing.Unidade_Custo);
      const unidadePadrao = categoria === 'massa' ? 'g' :
                            categoria === 'volume' ? 'ml' :
                            categoria === 'contavel' ? 'un' : ing.Unidade_Usada;

      let quantidade = converterQuantidade(
        ing.Quantidade_Utilizada,
        ing.Unidade_Usada,
        unidadePadrao
      );

      // Se for ovo e unidade for "unidade", "un" ou "unidades", multiplica por 30 (Provisóriamente, ASS:Andress) confia
  
      if (
        ing.Nome_Ingrediente &&
        ing.Nome_Ingrediente.toLowerCase().includes('ovo') &&
        ['unidade', 'un', 'unidades'].includes(ing.Unidade_Usada?.toLowerCase())
      ) {
        quantidade = quantidade / 30; //Apenas confie assinado Andress HEHEHEHEHEHEHEHEHEHEHE
        console.log(`[AJUSTE OVO] Ingrediente "${ing.Nome_Ingrediente}" em unidade: dividindo por 30. Nova quantidade: ${quantidade}`);
      }

      // Se for volume, divide por 1000 (ex: ml para L) (Apenas confie, Assinado Andress)
      if (categoria === 'volume') {
        quantidade = quantidade / 1000;
        console.log(`[AJUSTE VOLUME] Ingrediente "${ing.Nome_Ingrediente}" relacionado a volume: dividindo por 1000. Nova quantidade: ${quantidade}`);
      }

      let custoUnitario = Number(ing.Custo_Unitario);

      // Conversão de unidade de custo para unidade padrão (g, ml, un)
      if (ing.Unidade_Custo !== unidadePadrao) {
        const fatorOrigem = obterFatorConversao(ing.Unidade_Custo);
        const fatorDestino = obterFatorConversao(unidadePadrao);
        custoUnitario = custoUnitario * (fatorDestino / fatorOrigem);
      }

      // Conversão especial para kg → g e g → kg (já existe)
      if (ing.Unidade_Custo === 'kg' && unidadePadrao === 'g') {
        custoUnitario = custoUnitario / 1000;
      }
      if (ing.Unidade_Custo === 'g' && unidadePadrao === 'kg') {
        custoUnitario = custoUnitario * 1000;
      }

      // >>> Adicione a conversão especial para L → ml e ml → L <<<(Dá certo confia)
      if (ing.Unidade_Custo === 'l' && unidadePadrao === 'ml') {
        custoUnitario = custoUnitario / 1000;
      }
      if (ing.Unidade_Custo === 'ml' && unidadePadrao === 'l') {
        custoUnitario = custoUnitario * 1000;
      }

      const custoBase = custoUnitario * quantidade;
      const fatorDesperdicio = 1 + (Number(ing.Indice_de_Desperdicio) / 100);
      const custoFinal = custoBase * fatorDesperdicio;

      custoIngredientes += custoFinal;

      // Console detalhado por ingrediente (Aqui eu verifiquei umas mmil vezes o cálculo para ele dar certo)
      console.log('-------------------------------');
      console.log(`Ingrediente: ${ing.Nome_Ingrediente}`);
      console.log(`  Quantidade usada: ${ing.Quantidade_Utilizada} ${ing.Unidade_Usada}`);
      console.log(`  Unidade custo: ${ing.Unidade_Custo}`);
      console.log(`  Custo unitário: ${ing.Custo_Unitario}`);
      // ...outros detalhes do cálculo...
    }

    const despesas = await obterDespesasUsuario(ID_Usuario);
    console.log('Despesas puxadas para o usuário:', despesas);

    const custoPorMinuto = calcularCustoOperacionalPorMinuto(despesas);
    const custoOperacional = custoPorMinuto * tempoSeguro;

    console.log(`Custo operacional por minuto: ${custoPorMinuto}`);
    console.log(`Custo operacional total: ${custoOperacional}`);

    const custoTotal = custoIngredientes + custoOperacional;
    const precoFinal = custoTotal * (1 + (lucroSeguro / 100));

    console.log('-------------------------------');
    console.log(`Custo total ingredientes: ${custoIngredientes}`);
    console.log(`Custo operacional: ${custoOperacional}`);
    console.log(`Custo total (ingredientes + operacional): ${custoTotal}`);
    console.log(`Margem de lucro aplicada: ${porcentagemDeLucro}%`);
    console.log(`Preço final (com lucro): ${precoFinal}`);
    console.log('==== FIM DO CÁLCULO DA RECEITA ====');

    await db.query(
      `UPDATE receitas
       SET Custo_Total_Ingredientes = ?
       WHERE ID_Receita = ?`,
      [
        precoFinal,
        ID_Receita
      ]
    );

    return {
      custoIngredientes: +custoIngredientes.toFixed(CONFIG.PRECISAO_EXIBICAO),
      custoOperacional: +custoOperacional.toFixed(CONFIG.PRECISAO_EXIBICAO),
      custoTotal: +custoTotal.toFixed(CONFIG.PRECISAO_EXIBICAO),
      precoFinal: +precoFinal.toFixed(CONFIG.PRECISAO_EXIBICAO),
      custoPorMinuto: +custoPorMinuto.toFixed(CONFIG.PRECISAO_EXIBICAO)
    };

  } catch (error) {
    console.error('Erro ao calcular preço da receita:', error.message);
    throw error;
  }
}

export async function atualizaReceitasPorIngrediente(ID_Ingrediente) {
  try {
    const [receitasAfetadas] = await db.query(
      `SELECT r.ID_Receita, r.ID_Usuario, r.Porcentagem_De_Lucro, r.Tempo_Preparo
       FROM receitas r
       JOIN ingredientes_receita ir ON r.ID_Receita = ir.ID_Receita
       WHERE ir.ID_Ingredientes = ?`,
      [ID_Ingrediente]
    );

    for (const receita of receitasAfetadas) {
      await calculaPrecoReceitaCompleto(
        receita.ID_Receita,
        receita.ID_Usuario,
        receita.Porcentagem_De_Lucro || 0,
        receita.Tempo_Preparo || 0
      );
    }

    console.log(`Atualizadas ${receitasAfetadas.length} receitas com o ingrediente ID ${ID_Ingrediente}`);
    return true;

  } catch (error) {
    console.error('Erro ao atualizar receitas por ingrediente:', error.message);
    return false;
  }
}

export async function atualizaReceitasPorDespesa(ID_Usuario) {
  try {
    // Pega todas as receitas do usuário
    const [receitas] = await db.query(
      `SELECT ID_Receita, Porcentagem_De_Lucro, Tempo_Preparo, ID_Usuario
       FROM receitas
       WHERE ID_Usuario = ?`,
      [ID_Usuario]
    );

    for (const receita of receitas) {
      await calculaPrecoReceitaCompleto(
        receita.ID_Receita,
        receita.ID_Usuario,
        receita.Porcentagem_De_Lucro || 0,
        receita.Tempo_Preparo || 0
      );
    }

    console.log(`Atualizadas ${receitas.length} receitas para o usuário ID ${ID_Usuario}`);
    return true;

  } catch (error) {
    console.error('Erro ao atualizar receitas por despesa:', error.message);
    return false;
  }
}

// Recalcula todas as receitas de todos os usuários (usado quando despesas são globais)
export async function atualizaReceitasTodasDespesas() {
  try {
    const [usuarios] = await db.query(`SELECT DISTINCT ID_Usuario FROM receitas`);
    for (const u of usuarios) {
      const ID_Usuario = u.ID_Usuario;
      despesasCache.delete(ID_Usuario); // limpa cache antes de recalcular
      await atualizaReceitasPorDespesa(ID_Usuario);
    }
    console.log(`Recalculo global de receitas concluído para ${usuarios.length} usuários.`);
    return true;
  } catch (error) {
    console.error('Erro ao recalcular todas as receitas após mudança de despesas:', error.message);
    return false;
  }
}

export async function atualizaDespesa(ID_Despesa, nome, custoMensal, tempoOperacional, ID_Usuario) {
  try {
    const idNum = Number(ID_Despesa);
    if (isNaN(idNum)) throw new Error('ID_Despesa inválido');

    // Atualiza a despesa no banco de dados
    await db.query(
      `UPDATE despesas
       SET Nome_Despesa = ?, Custo_Mensal = ?, Tempo_Operacional = ?
       WHERE ID_Despesa = ?`,
      [nome.trim(), custoMensal, tempoOperacional, idNum]
    );

    // Limpa o cache para garantir que o próximo cálculo use os dados atualizados
    despesasCache.delete(ID_Usuario);

    console.log(`[PUT] Despesa atualizada para usuário ${ID_Usuario}. Recalculando receitas...`);
    await atualizaDespesa(idNum, nome, custoMensal, tempoOperacional, ID_Usuario);

    return true;
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error.message);
    return false;
  }
}

export function limparCacheDespesas(ID_Usuario) {
  despesasCache.delete(ID_Usuario);
}
