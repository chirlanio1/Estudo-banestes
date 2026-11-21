import type { Kit } from '../types';

/** Resumos de teoria ("kits") por subtópico, priorizados pelo peso no edital. */
const LISTA: Kit[] = [
  {
    topico: 'bd-sql', titulo: 'SQL: consultas, agregação e NULL',
    resumo: [
      'Ordem lógica de execução: FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. Por isso WHERE não enxerga apelidos do SELECT nem funções de agregação.',
      'WHERE filtra linhas antes de agrupar; HAVING filtra grupos depois de agrupar.',
      'COUNT(*) conta linhas; COUNT(coluna), SUM, AVG, MIN e MAX ignoram NULL.',
      'NULL não é igual a nada, nem a outro NULL: use IS NULL / IS NOT NULL. Comparações com NULL dão "desconhecido".',
      'INNER JOIN traz só os pares que casam; LEFT JOIN mantém todas as linhas da tabela da esquerda, preenchendo a direita com NULL.',
      'Categorias: DDL (CREATE, ALTER, DROP, TRUNCATE), DML (INSERT, UPDATE, DELETE), DQL (SELECT), DCL (GRANT, REVOKE), TCL (COMMIT, ROLLBACK).'
    ],
    comoCobra: 'A FCC dá uma ou duas tabelas pequenas e pede o resultado de uma consulta. Ela coloca NULL de propósito para testar COUNT, AVG e comparações.',
    pegadinhas: ['AVG ignora NULL: divide só pelos não nulos.', 'LEFT JOIN + COUNT(*) conta 1 para quem não casou; COUNT(coluna_da_direita) conta 0.', '"= NULL" nunca é verdadeiro.', 'TRUNCATE é DDL; DELETE é DML.'],
    mapa: { t: 'SQL', c: [
      { t: 'Ordem lógica', c: [{ t: 'FROM/JOIN' }, { t: 'WHERE' }, { t: 'GROUP BY' }, { t: 'HAVING' }, { t: 'SELECT' }, { t: 'ORDER BY' }] },
      { t: 'NULL', c: [{ t: 'IS NULL' }, { t: 'agregações ignoram' }] },
      { t: 'JOINs', c: [{ t: 'INNER' }, { t: 'LEFT/RIGHT' }, { t: 'FULL' }] },
      { t: 'Categorias', c: [{ t: 'DDL' }, { t: 'DML' }, { t: 'DCL' }, { t: 'TCL' }] }
    ] },
    cartoes: [
      { f: 'Diferença entre WHERE e HAVING?', v: 'WHERE filtra linhas antes do GROUP BY; HAVING filtra grupos depois.' },
      { f: 'COUNT(*) × COUNT(coluna)?', v: 'COUNT(*) conta todas as linhas; COUNT(coluna) ignora NULL.' },
      { f: 'Como testar se um valor é nulo?', v: 'IS NULL (nunca "= NULL").' },
      { f: 'O que o LEFT JOIN faz com quem não casa?', v: 'Mantém a linha da esquerda e preenche as colunas da direita com NULL.' },
      { f: 'GRANT e REVOKE são de qual categoria?', v: 'DCL (Data Control Language).' },
      { f: 'TRUNCATE é DDL ou DML?', v: 'DDL (DELETE é DML).' }
    ],
    fontes: ['Elmasri & Navathe, Sistemas de Banco de Dados', 'Padrão ISO SQL'], verificacao: 'executado'
  },
  {
    topico: 'bd-sqlavancado', titulo: 'SQL avançado: subconsultas, CTE e funções de janela',
    resumo: [
      'Subconsulta correlacionada referencia a consulta externa e roda para cada linha dela.',
      'NOT IN com subconsulta que devolve NULL retorna vazio. NOT EXISTS não sofre desse problema.',
      'CTE (WITH nome AS (...)) cria um resultado temporário com nome, deixando a consulta legível; WITH RECURSIVE percorre hierarquias.',
      'Funções de janela (OVER) calculam sem colapsar linhas: ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, SUM() OVER (PARTITION BY ...).',
      'RANK pula posições após empates (1, 2, 2, 4); DENSE_RANK não pula (1, 2, 2, 3); ROW_NUMBER nunca repete.',
      'UNION remove duplicatas; UNION ALL mantém todas as linhas (e é mais rápido).'
    ],
    comoCobra: 'Pede a saída de consultas com subconsulta, NOT IN/EXISTS ou ranking. Também cobra a diferença UNION × UNION ALL.',
    pegadinhas: ['NOT IN + NULL na lista = nenhuma linha.', 'RANK × DENSE_RANK após empate.', 'PARTITION BY reinicia a contagem por grupo.'],
    mapa: { t: 'SQL avançado', c: [{ t: 'Subconsultas', c: [{ t: 'IN/NOT IN' }, { t: 'EXISTS' }, { t: 'correlacionada' }] }, { t: 'CTE', c: [{ t: 'WITH' }, { t: 'RECURSIVE' }] }, { t: 'Janela', c: [{ t: 'ROW_NUMBER' }, { t: 'RANK' }, { t: 'DENSE_RANK' }, { t: 'LAG/LEAD' }] }, { t: 'Conjuntos', c: [{ t: 'UNION' }, { t: 'UNION ALL' }, { t: 'INTERSECT/EXCEPT' }] }] },
    cartoes: [
      { f: 'Por que NOT IN pode voltar vazio?', v: 'Se a subconsulta tem NULL, "x <> NULL" é desconhecido para todas as linhas.' },
      { f: 'RANK para 100, 90, 90, 80?', v: '1, 2, 2, 4.' },
      { f: 'DENSE_RANK para 100, 90, 90, 80?', v: '1, 2, 2, 3.' },
      { f: 'UNION × UNION ALL?', v: 'UNION elimina duplicatas; UNION ALL mantém.' },
      { f: 'O que PARTITION BY faz numa função de janela?', v: 'Divide as linhas em grupos e reinicia o cálculo em cada um, sem colapsar linhas.' }
    ],
    fontes: ['Padrão ISO SQL:2003 (funções de janela)', 'Documentação PostgreSQL'], verificacao: 'executado'
  },
  {
    topico: 'bd-normalizacao', titulo: 'Normalização (1FN a FNBC)',
    resumo: [
      'Dependência funcional X → Y: o valor de X determina o de Y.',
      '1FN: atributos atômicos, sem grupos repetidos nem atributos multivalorados.',
      '2FN: 1FN + nenhum atributo não chave depende de PARTE da chave composta (sem dependência parcial). Tabela com chave simples na 1FN já está na 2FN.',
      '3FN: 2FN + nenhum atributo não chave depende de outro não chave (sem dependência transitiva).',
      'FNBC: todo determinante é chave candidata (mais rígida que a 3FN).',
      '4FN: sem dependências multivaloradas; 5FN: sem dependências de junção.'
    ],
    comoCobra: 'Dá uma tabela com a chave e as dependências e pergunta qual forma normal ela viola ou como decompor.',
    pegadinhas: ['Chave simples não tem dependência parcial: o problema costuma ser 3FN.', 'Desnormalizar é decisão de desempenho (comum em DW), não erro.'],
    mapa: { t: 'Formas normais', c: [{ t: '1FN', c: [{ t: 'atômico' }] }, { t: '2FN', c: [{ t: 'sem parcial' }] }, { t: '3FN', c: [{ t: 'sem transitiva' }] }, { t: 'FNBC', c: [{ t: 'determinante = chave' }] }, { t: '4FN', c: [{ t: 'sem multivalorada' }] }] },
    cartoes: [
      { f: 'O que a 2FN elimina?', v: 'Dependência parcial de parte da chave composta.' },
      { f: 'O que a 3FN elimina?', v: 'Dependência transitiva: não chave → não chave.' },
      { f: 'Regra da FNBC?', v: 'Todo determinante é chave candidata.' },
      { f: 'O que a 1FN exige?', v: 'Atributos atômicos, sem multivalorados nem grupos repetidos.' }
    ],
    fontes: ['Elmasri & Navathe', 'C. J. Date, Introdução a Sistemas de Banco de Dados'], verificacao: 'fonte'
  },
  {
    topico: 'prog-oo', titulo: 'Orientação a objetos',
    resumo: [
      'Pilares: abstração, encapsulamento, herança e polimorfismo.',
      'Encapsulamento: estado privado, acesso por métodos. Em Java: private, (default/pacote), protected, public.',
      'Herança: "é um". Composição: "tem um"; prefira composição quando não houver relação real de tipo.',
      'Sobrecarga (overloading): mesmo nome, parâmetros diferentes, resolvida na compilação. Sobrescrita (overriding): mesma assinatura na subclasse, resolvida na execução.',
      'Classe abstrata pode ter estado e métodos concretos; interface define contrato (em Java 8+ pode ter métodos default e static).',
      'Acoplamento baixo e coesão alta são os objetivos de um bom projeto.'
    ],
    comoCobra: 'Afirmativas conceituais (verdadeiro/falso) e trechos de código com herança perguntando qual método roda.',
    pegadinhas: ['Método static não é sobrescrito, é escondido.', 'Mudar só o tipo de retorno não é sobrecarga.', 'protected em Java também libera acesso no mesmo pacote.'],
    mapa: { t: 'POO', c: [{ t: 'Abstração' }, { t: 'Encapsulamento', c: [{ t: 'modificadores' }] }, { t: 'Herança', c: [{ t: 'é um' }, { t: 'composição: tem um' }] }, { t: 'Polimorfismo', c: [{ t: 'sobrecarga' }, { t: 'sobrescrita' }] }] },
    cartoes: [
      { f: 'Sobrecarga é resolvida quando?', v: 'Em tempo de compilação, pela assinatura.' },
      { f: 'Sobrescrita é resolvida quando?', v: 'Em tempo de execução, pelo tipo real do objeto.' },
      { f: 'A obj = new B(); obj.m() chama qual m()?', v: 'O de B, se B sobrescreve m (ligação dinâmica).' },
      { f: 'Alta coesão significa…', v: 'A classe faz uma coisa bem definida.' },
      { f: 'Classe abstrata × interface?', v: 'Abstrata pode ter estado e construtor; interface é contrato (sem estado de instância).' }
    ],
    fontes: ['Java Language Specification', 'Deitel, Java: como programar'], verificacao: 'fonte'
  },
  {
    topico: 'prog-java', titulo: 'Java: detalhes que caem',
    resumo: [
      'Tipos primitivos (int, double, boolean, char…) × referências (String, objetos). == compara valor em primitivos e referência em objetos; use equals() para conteúdo.',
      'Divisão entre inteiros trunca: 7 / 2 = 3. Só vira 3.5 se um operando for double.',
      'i++ usa o valor e depois incrementa; ++i incrementa e depois usa.',
      'finally sempre executa (exceto System.exit), mesmo depois de return no try.',
      'Exceções checadas (Exception, IOException) precisam ser tratadas ou declaradas com throws; não checadas (RuntimeException) não.',
      'String é imutável; StringBuilder é mutável e mais eficiente em concatenações em laço.',
      'Coleções: List (ordem, duplicatas), Set (sem duplicatas), Map (chave → valor). ArrayList acesso rápido por índice; LinkedList inserção rápida nas pontas.'
    ],
    comoCobra: 'Trechos de código pedindo a saída. Os temas favoritos: ==/equals, incremento, divisão inteira, try/finally e herança.',
    pegadinhas: ['String com new cria objetos distintos: == dá false.', 'double d = 7/2 dá 3.0.', 'finally imprime antes do retorno ser usado.'],
    mapa: { t: 'Java', c: [{ t: 'Tipos', c: [{ t: 'primitivos' }, { t: 'referência' }] }, { t: 'Operadores', c: [{ t: 'i++ / ++i' }, { t: 'divisão inteira' }] }, { t: 'Exceções', c: [{ t: 'checadas' }, { t: 'Runtime' }, { t: 'finally' }] }, { t: 'Coleções', c: [{ t: 'List' }, { t: 'Set' }, { t: 'Map' }] }] },
    cartoes: [
      { f: 'new String("a") == new String("a")?', v: 'false (referências diferentes); equals dá true.' },
      { f: 'int i=5; j = i++ + ++i → i e j?', v: 'i = 7, j = 12.' },
      { f: 'double d = 7 / 2 vale?', v: '3.0.' },
      { f: 'RuntimeException precisa de throws?', v: 'Não; é exceção não checada.' },
      { f: 'Set aceita duplicatas?', v: 'Não.' }
    ],
    fontes: ['Java Language Specification (Oracle)'], verificacao: 'executado'
  },
  {
    topico: 'prog-python', titulo: 'Python: detalhes que caem',
    resumo: [
      'Fatiamento lst[a:b] inclui a e exclui b; índices negativos contam do fim (-1 é o último).',
      'Listas são mutáveis; tuplas e strings são imutáveis. Atribuição b = a não copia: as duas apontam para o mesmo objeto.',
      'Valor padrão mutável (def f(x, l=[])) é criado uma única vez e reaproveitado entre chamadas.',
      'range(n) vai de 0 a n−1. Compreensões: [x*2 for x in lst if x > 0].',
      'Dicionário: chave → valor; chaves precisam ser imutáveis (hashable). set não tem ordem nem duplicatas.',
      '/ sempre dá float (7/2 = 3.5); // é divisão inteira (7//2 = 3); % é resto; ** é potência.'
    ],
    comoCobra: 'Código curto pedindo a saída: fatiamento, aliasing, parâmetro padrão mutável e laços com range.',
    pegadinhas: ['range(4) não inclui o 4.', 'Em Python, 7/2 = 3.5 (diferente de Java).', 'Parâmetro padrão mutável acumula valores.'],
    mapa: { t: 'Python', c: [{ t: 'Sequências', c: [{ t: 'fatiamento' }, { t: 'índices negativos' }] }, { t: 'Mutabilidade', c: [{ t: 'list/dict/set' }, { t: 'tuple/str' }, { t: 'aliasing' }] }, { t: 'Funções', c: [{ t: 'padrão mutável' }] }, { t: 'Operadores', c: [{ t: '/ e //' }, { t: '**' }] }] },
    cartoes: [
      { f: '[10,20,30,40,50][1:4]?', v: '[20, 30, 40].' },
      { f: '7/2 e 7//2 em Python?', v: '3.5 e 3.' },
      { f: 'b = a; b.append(3) altera a?', v: 'Sim: as duas variáveis apontam para a mesma lista.' },
      { f: 'Como evitar o bug do padrão mutável?', v: 'Usar lista=None e criar a lista dentro da função.' },
      { f: 'sum(x**2 for x in range(4))?', v: '14.' }
    ],
    fontes: ['Documentação oficial Python 3'], verificacao: 'executado'
  },
  {
    topico: 'es-scrum', titulo: 'Scrum (Guia 2020)',
    resumo: [
      'Pilares empíricos: transparência, inspeção e adaptação. Valores: compromisso, foco, abertura, respeito e coragem.',
      'Time Scrum: Product Owner (maximiza valor, ordena o Product Backlog), Scrum Master (eficácia do time, remove impedimentos) e Developers. Geralmente até 10 pessoas.',
      'Eventos: Sprint (até 1 mês, contém os demais), Sprint Planning (até 8h para Sprint de 1 mês), Daily Scrum (15 min), Sprint Review (até 4h), Sprint Retrospective (até 3h).',
      'Artefatos e compromissos: Product Backlog → Meta do Produto; Sprint Backlog → Meta da Sprint; Incremento → Definição de Pronto.',
      'Só o Product Owner pode cancelar a Sprint, quando a Meta da Sprint se torna obsoleta.'
    ],
    comoCobra: 'Afirmativas sobre papéis, duração dos eventos e compromissos dos artefatos, usando o texto do Guia.',
    pegadinhas: ['Não existe "gerente de projeto" no Scrum.', 'Daily é para os Developers, não é reunião de status para o PO.', 'Quem cancela a Sprint é o PO.', 'O Guia 2020 trocou "papéis" por "accountabilities".'],
    mapa: { t: 'Scrum', c: [{ t: 'Time', c: [{ t: 'PO' }, { t: 'SM' }, { t: 'Developers' }] }, { t: 'Eventos', c: [{ t: 'Sprint ≤ 1 mês' }, { t: 'Planning ≤ 8h' }, { t: 'Daily 15 min' }, { t: 'Review ≤ 4h' }, { t: 'Retro ≤ 3h' }] }, { t: 'Artefatos', c: [{ t: 'PB → Meta do Produto' }, { t: 'SB → Meta da Sprint' }, { t: 'Incremento → DoD' }] }] },
    cartoes: [
      { f: 'Compromisso do Product Backlog?', v: 'Meta do Produto.' },
      { f: 'Compromisso do Incremento?', v: 'Definição de Pronto.' },
      { f: 'Duração da Daily?', v: '15 minutos.' },
      { f: 'Quem pode cancelar a Sprint?', v: 'Somente o Product Owner.' },
      { f: 'Retrospectiva de Sprint de 1 mês dura até…', v: '3 horas.' },
      { f: 'Três pilares do Scrum?', v: 'Transparência, inspeção e adaptação.' }
    ],
    fontes: ['Guia do Scrum, novembro de 2020 (scrumguides.org)'], verificacao: 'fonte'
  },
  {
    topico: 'es-testes', titulo: 'Testes de software',
    resumo: [
      'Níveis: unitário, integração, sistema e aceitação. Regressão: reexecutar testes após mudanças.',
      'Caixa-preta (funcional): partição de equivalência, valor-limite, tabela de decisão. Caixa-branca (estrutural): cobertura de comandos, desvios e caminhos.',
      'Valor-limite: testar o limite e o vizinho inválido (ex.: faixa 18–60 → 17, 18, 60, 61).',
      'Alfa: no ambiente do desenvolvedor, com usuários. Beta: no ambiente do usuário, sem o desenvolvedor.',
      'TDD: vermelho (teste falha) → verde (código mínimo) → refatorar.',
      'Dublês de teste: dummy, stub (respostas prontas), spy, mock (verifica interações) e fake.'
    ],
    comoCobra: 'Pede para identificar a técnica pelo exemplo, ou calcula casos de teste por valor-limite e partição.',
    pegadinhas: ['Beta é no ambiente do usuário.', 'Valor-limite inclui o próprio limite.', 'Teste mostra a presença de defeitos, não a ausência (princípio do ISTQB).'],
    mapa: { t: 'Testes', c: [{ t: 'Níveis', c: [{ t: 'unitário' }, { t: 'integração' }, { t: 'sistema' }, { t: 'aceitação' }] }, { t: 'Caixa-preta', c: [{ t: 'partição' }, { t: 'valor-limite' }] }, { t: 'Caixa-branca', c: [{ t: 'cobertura' }] }, { t: 'TDD' }] },
    cartoes: [
      { f: 'Faixa válida 18–60: casos por valor-limite?', v: '17, 18, 60 e 61.' },
      { f: 'Alfa × beta?', v: 'Alfa no ambiente do desenvolvedor; beta no do usuário.' },
      { f: 'Ciclo do TDD?', v: 'Vermelho → verde → refatorar.' },
      { f: 'Teste de regressão serve para…', v: 'Verificar que mudanças não quebraram o que funcionava.' },
      { f: 'Mock × stub?', v: 'Stub devolve respostas prontas; mock também verifica as interações esperadas.' }
    ],
    fontes: ['ISTQB Foundation Level Syllabus', 'Pressman, Engenharia de Software'], verificacao: 'fonte'
  },
  {
    topico: 'es-uml', titulo: 'UML: classes e casos de uso',
    resumo: [
      'Diagramas estruturais: classes, objetos, componentes, implantação, pacotes. Comportamentais: casos de uso, atividades, estados, sequência, comunicação.',
      'Associação: linha. Agregação: losango vazio (parte vive sem o todo). Composição: losango cheio (parte morre com o todo).',
      'Generalização (herança): seta com triângulo vazio. Realização (implementa interface): seta tracejada com triângulo vazio. Dependência: seta tracejada aberta.',
      'Casos de uso: <<include>> é sempre executado; <<extend>> é opcional, sob condição.',
      'Visibilidade: + público, − privado, # protegido, ~ pacote.'
    ],
    comoCobra: 'Mostra a notação (ou descreve a relação) e pede o nome correto; ou exemplos de include × extend.',
    pegadinhas: ['Agregação (vazio) × composição (cheio).', 'include obrigatório × extend opcional.', 'Diagrama de sequência é comportamental (de interação).'],
    mapa: { t: 'UML', c: [{ t: 'Estruturais', c: [{ t: 'classes' }, { t: 'componentes' }, { t: 'implantação' }] }, { t: 'Comportamentais', c: [{ t: 'casos de uso' }, { t: 'atividades' }, { t: 'estados' }, { t: 'sequência' }] }, { t: 'Relações', c: [{ t: 'agregação ◇' }, { t: 'composição ◆' }, { t: 'generalização' }, { t: 'realização' }] }] },
    cartoes: [
      { f: 'Losango preenchido?', v: 'Composição.' },
      { f: '<<include>> × <<extend>>?', v: 'include: sempre executa; extend: opcional, sob condição.' },
      { f: 'Símbolo # na UML?', v: 'Visibilidade protegida.' },
      { f: 'Seta tracejada com triângulo vazio?', v: 'Realização (implementação de interface).' }
    ],
    fontes: ['OMG UML 2.5.1'], verificacao: 'fonte'
  },
  {
    topico: 'gov-itil', titulo: 'ITIL: valor, serviço e práticas',
    resumo: [
      'ITIL 4: Sistema de Valor de Serviço (SVS) com princípios orientadores, governança, cadeia de valor de serviço, práticas e melhoria contínua.',
      'Cadeia de valor: planejar, melhorar, engajar, desenho e transição, obter/construir, entregar e suportar.',
      'Sete princípios orientadores: foco no valor; comece onde você está; progrida iterativamente com feedback; colabore e promova visibilidade; pense e trabalhe de forma holística; mantenha simples e prático; otimize e automatize.',
      'Incidente: interrupção ou queda de qualidade (restaurar rápido). Problema: causa de incidentes. Erro conhecido: problema com causa identificada.',
      'Mudanças: padrão (pré-autorizada), normal (avaliada) e emergencial.',
      'SLA com o cliente; OLA entre áreas internas; contrato de apoio (UC) com fornecedor.'
    ],
    comoCobra: 'Diferenciar incidente e problema, tipos de mudança e o papel das práticas. O edital cita ITIL Version 5: os termos podem ter mudado.',
    pegadinhas: ['Problema é a causa, não o sintoma.', 'Mudança padrão já é pré-autorizada.', 'OLA não é com o cliente.'],
    mapa: { t: 'ITIL', c: [{ t: 'SVS', c: [{ t: 'princípios' }, { t: 'governança' }, { t: 'cadeia de valor' }, { t: 'práticas' }, { t: 'melhoria' }] }, { t: 'Práticas', c: [{ t: 'incidente' }, { t: 'problema' }, { t: 'mudança' }, { t: 'nível de serviço' }] }] },
    cartoes: [
      { f: 'Incidente × problema?', v: 'Incidente: interrupção do serviço. Problema: causa de um ou mais incidentes.' },
      { f: 'Mudança padrão?', v: 'Baixo risco, pré-autorizada, procedimento documentado.' },
      { f: 'SLA × OLA?', v: 'SLA com o cliente; OLA entre equipes internas.' },
      { f: 'Seis atividades da cadeia de valor (ITIL 4)?', v: 'Planejar, melhorar, engajar, desenho e transição, obter/construir, entregar e suportar.' }
    ],
    fontes: ['AXELOS, ITIL 4 Foundation', 'Conferir publicação ITIL Version 5 (PeopleCert)'], verificacao: 'conferir'
  },
  {
    topico: 'gov-cobit', titulo: 'COBIT 2019',
    resumo: [
      'Separa governança (conselho: avaliar, dirigir, monitorar) de gestão (planejar, construir, executar, monitorar).',
      '40 objetivos em 5 domínios: EDM (governança); APO, BAI, DSS e MEA (gestão).',
      'Componentes do sistema de governança: processos, estruturas organizacionais, princípios e políticas, informação, cultura e comportamento, pessoas e competências, serviços/infraestrutura/aplicações.',
      'Fatores de desenho (design factors) ajustam o sistema à realidade da empresa (estratégia, riscos, porte, papel da TI…).',
      'Níveis de capacidade de processo de 0 a 5.'
    ],
    comoCobra: 'Pergunta a qual domínio pertence um objetivo e a diferença entre governança e gestão.',
    pegadinhas: ['EDM é o único domínio de governança.', 'MEA é gestão, mesmo tendo "monitorar" no nome.'],
    mapa: { t: 'COBIT 2019', c: [{ t: 'Governança', c: [{ t: 'EDM' }] }, { t: 'Gestão', c: [{ t: 'APO' }, { t: 'BAI' }, { t: 'DSS' }, { t: 'MEA' }] }, { t: 'Componentes (7)' }, { t: 'Fatores de desenho' }] },
    cartoes: [
      { f: 'Domínio de governança do COBIT 2019?', v: 'EDM: Avaliar, Dirigir e Monitorar.' },
      { f: 'Quantos objetivos tem o COBIT 2019?', v: '40.' },
      { f: 'BAI significa…', v: 'Construir, Adquirir e Implementar.' },
      { f: 'DSS significa…', v: 'Entregar, Servir e Suportar.' }
    ],
    fontes: ['ISACA, COBIT 2019 Framework: Introduction and Methodology'], verificacao: 'fonte'
  },
  {
    topico: 'gov-pmbok', titulo: 'Gerenciamento de projetos',
    resumo: [
      'A 7ª edição do PMBOK trocou processos por 12 princípios e 8 domínios de desempenho. O edital cita a 8ª edição: confira a estrutura dela.',
      'EAP (WBS): decomposição hierárquica do escopo; o nível mais baixo é o pacote de trabalho.',
      'Caminho crítico: o mais longo da rede; atividades nele têm folga zero.',
      'Valor agregado: CPI = EV/AC; SPI = EV/PV; CV = EV − AC; SV = EV − PV. Índice < 1 é desfavorável.',
      'Termo de abertura autoriza o projeto e dá autoridade ao gerente.'
    ],
    comoCobra: 'Cálculos de caminho crítico e de valor agregado, mais conceitos de escopo e partes interessadas.',
    pegadinhas: ['CPI usa AC (custo real); SPI usa PV (valor planejado).', 'Caminho crítico é o mais LONGO.'],
    mapa: { t: 'Projetos', c: [{ t: 'Escopo', c: [{ t: 'EAP' }] }, { t: 'Cronograma', c: [{ t: 'caminho crítico' }, { t: 'folga' }] }, { t: 'Custos', c: [{ t: 'CPI = EV/AC' }, { t: 'SPI = EV/PV' }] }] },
    cartoes: [
      { f: 'Fórmula do CPI?', v: 'EV ÷ AC.' },
      { f: 'Fórmula do SPI?', v: 'EV ÷ PV.' },
      { f: 'Folga das atividades do caminho crítico?', v: 'Zero.' },
      { f: 'Nível mais baixo da EAP?', v: 'Pacote de trabalho.' }
    ],
    fontes: ['PMI, PMBOK Guide (conferir 8ª edição)'], verificacao: 'conferir'
  },
  {
    topico: 'seg-cripto', titulo: 'Criptografia',
    resumo: [
      'Simétrica: mesma chave para cifrar e decifrar (AES, 3DES, ChaCha20). Rápida; problema é distribuir a chave.',
      'Assimétrica: par de chaves (RSA, ECC). Confidencialidade: cifrar com a pública do destinatário. Assinatura: assinar com a privada do remetente.',
      'Hash: resumo de tamanho fixo, sem volta (SHA-256, SHA-3). Garante integridade. MD5 e SHA-1 são inseguros para colisão.',
      'Assinatura digital = hash da mensagem cifrado com a chave privada: autenticidade, integridade e não repúdio (não dá sigilo).',
      'Certificado digital liga uma chave pública a uma identidade, assinado por uma autoridade certificadora (no Brasil, ICP-Brasil).',
      'TLS usa assimétrica para combinar a chave e simétrica para os dados (criptografia híbrida).'
    ],
    comoCobra: 'Qual chave usar em cada cenário, o que cada mecanismo garante e classificação de algoritmos.',
    pegadinhas: ['Assinatura não garante confidencialidade.', 'Diffie-Hellman é troca de chaves, não cifra mensagens.', 'Hash não é criptografia reversível.'],
    mapa: { t: 'Criptografia', c: [{ t: 'Simétrica', c: [{ t: 'AES' }, { t: '3DES' }] }, { t: 'Assimétrica', c: [{ t: 'RSA' }, { t: 'ECC' }, { t: 'DH' }] }, { t: 'Hash', c: [{ t: 'SHA-2' }, { t: 'SHA-3' }] }, { t: 'Assinatura', c: [{ t: 'autenticidade' }, { t: 'integridade' }, { t: 'não repúdio' }] }] },
    cartoes: [
      { f: 'Para sigilo, cifrar com qual chave?', v: 'A pública do destinatário.' },
      { f: 'Para assinar, usar qual chave?', v: 'A privada do remetente.' },
      { f: 'O que a assinatura digital garante?', v: 'Autenticidade, integridade e não repúdio.' },
      { f: 'AES é simétrico ou assimétrico?', v: 'Simétrico.' },
      { f: 'Para que serve o certificado digital?', v: 'Vincular uma chave pública a uma identidade, atestado por uma AC.' }
    ],
    fontes: ['Stallings, Criptografia e Segurança de Redes', 'NIST FIPS 197, 180-4, 186-5'], verificacao: 'fonte'
  },
  {
    topico: 'seg-owasp', titulo: 'OWASP Top 10 (2021)',
    resumo: [
      'A01 Quebra de Controle de Acesso; A02 Falhas Criptográficas; A03 Injeção (inclui XSS); A04 Design Inseguro; A05 Configuração Incorreta de Segurança.',
      'A06 Componentes Vulneráveis e Desatualizados; A07 Falhas de Identificação e Autenticação; A08 Falhas de Integridade de Software e Dados; A09 Falhas de Log e Monitoramento; A10 SSRF.',
      'Injeção: dados viram comando. Defesa: consultas parametrizadas, validação de entrada, ORM bem usado.',
      'XSS: script injetado na página. Defesa: codificar a saída (output encoding) e Content Security Policy.',
      'CSRF: usa a sessão da vítima. Defesa: token anti-CSRF e cookie SameSite.',
      'IDOR: trocar o id na URL e acessar dado alheio. Defesa: checar autorização no servidor.'
    ],
    comoCobra: 'Descreve um ataque e pede o nome ou a categoria; pede a defesa mais eficaz.',
    pegadinhas: ['Na versão 2021, XSS entrou em A03 Injeção.', 'HTTPS não impede injeção.', 'Ocultar erro não é defesa contra SQL injection.'],
    mapa: { t: 'OWASP 2021', c: [{ t: 'A01 Acesso' }, { t: 'A02 Cripto' }, { t: 'A03 Injeção' }, { t: 'A04 Design' }, { t: 'A05 Config' }, { t: 'A06 Componentes' }, { t: 'A07 Autenticação' }, { t: 'A08 Integridade' }, { t: 'A09 Logs' }, { t: 'A10 SSRF' }] },
    cartoes: [
      { f: 'A01 da OWASP 2021?', v: 'Quebra de Controle de Acesso.' },
      { f: 'Defesa principal contra SQL injection?', v: 'Consultas parametrizadas.' },
      { f: 'Onde está o XSS na lista 2021?', v: 'Em A03 Injeção.' },
      { f: 'O que é SSRF?', v: 'Fazer o servidor requisitar um endereço escolhido pelo atacante (A10).' },
      { f: 'Defesa contra CSRF?', v: 'Token anti-CSRF e cookie SameSite.' }
    ],
    fontes: ['OWASP Top 10 2021 (owasp.org/Top10)'], verificacao: 'fonte'
  },
  {
    topico: 'eti-lgpd', titulo: 'LGPD (Lei 13.709/2018)',
    resumo: [
      'Dado pessoal: informação relacionada a pessoa natural identificada ou identificável. Sensível: origem racial ou étnica, religião, opinião política, sindicato, saúde, vida sexual, genético, biométrico.',
      'Agentes de tratamento: controlador (decide) e operador (trata em nome do controlador). Encarregado (DPO): canal com titulares e ANPD.',
      'Dez bases legais (art. 7º), entre elas consentimento, obrigação legal, execução de contrato, legítimo interesse, proteção do crédito.',
      'Princípios (art. 6º): finalidade, adequação, necessidade, livre acesso, qualidade, transparência, segurança, prevenção, não discriminação, responsabilização.',
      'Direitos do titular (art. 18): confirmação, acesso, correção, anonimização, portabilidade, eliminação, informação, revogação do consentimento.',
      'Sanções (art. 52): advertência, multa de até 2% do faturamento limitada a R$ 50 milhões por infração, publicização, bloqueio, eliminação.'
    ],
    comoCobra: 'Definições do art. 5º, bases legais e direitos do titular, com o texto da lei.',
    pegadinhas: ['Consentimento é só uma das dez bases.', 'Controlador decide; operador executa.', 'Dado anonimizado não é dado pessoal (salvo se reversível).', 'Proteção do crédito é base legal própria: importante para banco.'],
    mapa: { t: 'LGPD', c: [{ t: 'Conceitos', c: [{ t: 'dado pessoal' }, { t: 'sensível' }, { t: 'anonimizado' }] }, { t: 'Agentes', c: [{ t: 'controlador' }, { t: 'operador' }, { t: 'encarregado' }] }, { t: 'Bases legais (10)' }, { t: 'Direitos (art. 18)' }, { t: 'Sanções (art. 52)' }] },
    cartoes: [
      { f: 'Operador na LGPD?', v: 'Quem trata dados em nome do controlador.' },
      { f: 'Quantas bases legais no art. 7º?', v: 'Dez.' },
      { f: 'Limite da multa simples?', v: '2% do faturamento no Brasil, limitada a R$ 50 milhões por infração.' },
      { f: 'Biometria é dado…', v: 'Sensível.' },
      { f: 'Consentimento pode ser revogado?', v: 'Sim, a qualquer momento, de forma gratuita e facilitada.' }
    ],
    fontes: ['Lei 13.709/2018 (planalto.gov.br)'], verificacao: 'fonte'
  },
  {
    topico: 'web-rest', titulo: 'HTTP e APIs REST',
    resumo: [
      'Métodos: GET (ler), POST (criar), PUT (substituir), PATCH (alterar parte), DELETE (remover). Seguros: GET, HEAD, OPTIONS. Idempotentes: os seguros + PUT e DELETE.',
      'Códigos: 2xx sucesso (200, 201 Created, 204 No Content); 3xx redirecionamento; 4xx erro do cliente (400, 401, 403, 404, 409); 5xx erro do servidor (500, 502, 503).',
      '401: falta autenticação. 403: autenticado sem permissão.',
      'Restrições REST: cliente-servidor, sem estado, cache, interface uniforme, sistema em camadas e código sob demanda (opcional).',
      'CORS: o servidor libera outras origens com Access-Control-Allow-Origin.',
      'Autenticação em APIs: tokens (JWT, OAuth 2.0). JWT é assinado, não cifrado: não guarde segredos nele.'
    ],
    comoCobra: 'Pergunta o método ou o código HTTP correto para um cenário e as restrições do REST.',
    pegadinhas: ['POST não é idempotente.', '401 × 403.', 'REST não exige JSON.', 'JWT padrão é só assinado (base64 legível).'],
    mapa: { t: 'HTTP/REST', c: [{ t: 'Métodos', c: [{ t: 'GET' }, { t: 'POST' }, { t: 'PUT' }, { t: 'PATCH' }, { t: 'DELETE' }] }, { t: 'Códigos', c: [{ t: '2xx' }, { t: '4xx' }, { t: '5xx' }] }, { t: 'REST', c: [{ t: 'stateless' }, { t: 'cache' }, { t: 'interface uniforme' }] }, { t: 'CORS' }] },
    cartoes: [
      { f: 'PUT é idempotente?', v: 'Sim.' },
      { f: 'POST é idempotente?', v: 'Não.' },
      { f: '201 significa…', v: 'Created: recurso criado.' },
      { f: '401 × 403?', v: '401: sem autenticação válida; 403: autenticado, mas sem permissão.' },
      { f: 'Quem configura o CORS?', v: 'O servidor que recebe a requisição.' }
    ],
    fontes: ['RFC 9110 (HTTP Semantics)', 'Roy Fielding (2000)'], verificacao: 'fonte'
  },
  {
    topico: 'pt-crase', titulo: 'Crase',
    resumo: [
      'Crase = preposição "a" + artigo "a(s)" (ou pronome "aquele/aquela/aquilo").',
      'Teste: troque a palavra feminina por uma masculina. Se virar "ao", há crase (fui à escola → fui ao colégio).',
      'Obrigatória: horas (às 14h), locuções femininas (às pressas, à medida que), "à moda de".',
      'Proibida: antes de verbo, de palavra masculina, de pronomes pessoais e de tratamento (exceto senhora, senhorita, dona), de artigo indefinido (uma) e de "a" singular diante de plural.',
      'Facultativa: antes de pronome possessivo feminino singular (à/a sua), de nome de mulher e depois de "até".',
      'Lugares: "volto DA Bahia" → vou à Bahia; "volto DE Vitória" → vou a Vitória.'
    ],
    comoCobra: 'Pede a frase em que a crase está correta, ou em que é facultativa, ou a reescrita que a mantém.',
    pegadinhas: ['"Para às 14h" é erro: "para" já é preposição.', '"à uma hora" indica hora (crase), mas "a uma pessoa" não.', '"a" singular + plural = sem crase.'],
    mapa: { t: 'Crase', c: [{ t: 'Obrigatória', c: [{ t: 'horas' }, { t: 'locuções femininas' }] }, { t: 'Proibida', c: [{ t: 'verbo' }, { t: 'masculino' }, { t: 'artigo indefinido' }] }, { t: 'Facultativa', c: [{ t: 'possessivo' }, { t: 'nome de mulher' }, { t: 'até' }] }] },
    cartoes: [
      { f: 'Teste rápido da crase?', v: 'Trocar por palavra masculina: se virar "ao", tem crase.' },
      { f: 'Crase antes de verbo?', v: 'Nunca.' },
      { f: 'Crase antes de "sua" (singular)?', v: 'Facultativa.' },
      { f: 'Vou a/à Vitória?', v: '"a Vitória" (volto de Vitória: sem artigo).' },
      { f: 'Crase com "até"?', v: 'Facultativa (até a / até à).' }
    ],
    fontes: ['Bechara, Moderna Gramática Portuguesa', 'Cegalla, Novíssima Gramática'], verificacao: 'gramatica'
  },
  {
    topico: 'pt-concordancia', titulo: 'Concordância verbal e nominal',
    resumo: [
      'Verbo concorda com o núcleo do sujeito, esteja onde estiver (inclusive depois do verbo).',
      'Impessoais (singular sempre): haver = existir/ocorrer/tempo passado; fazer = tempo ou clima. A impessoalidade passa ao auxiliar: "deve haver", "vai fazer".',
      '"Se" apassivador (VTD): verbo concorda com o sujeito paciente (vendem-se casas). "Se" indeterminador (VTI, VI): singular (precisa-se de técnicos).',
      'Existir, ocorrer, acontecer são pessoais: concordam com o sujeito.',
      'Nominal: anexo, obrigado, mesmo, próprio, quite concordam com o nome. Meio (advérbio = um pouco) e menos são invariáveis.',
      '"É proibido entrada" (sem artigo, invariável) × "É proibida a entrada" (com artigo, concorda).'
    ],
    comoCobra: 'Pede a frase correta entre cinco, quase sempre misturando haver, fazer, "se" e sujeito posposto.',
    pegadinhas: ['"Houveram problemas" é erro.', '"Devem haver" é erro.', '"Precisam-se de" é erro.', '"Meia preocupada" (advérbio) é erro.'],
    mapa: { t: 'Concordância', c: [{ t: 'Verbal', c: [{ t: 'impessoais: haver/fazer' }, { t: 'se apassivador' }, { t: 'se indeterminador' }, { t: 'sujeito posposto' }] }, { t: 'Nominal', c: [{ t: 'anexo/mesmo/próprio' }, { t: 'meio/menos' }, { t: 'é proibido' }] }] },
    cartoes: [
      { f: '"Haver" no sentido de existir?', v: 'Impessoal: singular (houve falhas).' },
      { f: 'Vendem-se casas ou vende-se casas?', v: 'Vendem-se casas (se apassivador, VTD).' },
      { f: 'Precisa-se de ou precisam-se de?', v: 'Precisa-se de (VTI, se indeterminador).' },
      { f: 'Deve haver ou devem haver?', v: 'Deve haver.' },
      { f: 'Ela está meio ou meia cansada?', v: 'Meio (advérbio, invariável).' }
    ],
    fontes: ['Bechara, Moderna Gramática Portuguesa', 'Cegalla, Novíssima Gramática'], verificacao: 'gramatica'
  },
  {
    topico: 'pt-pontuacao', titulo: 'Pontuação (vírgula)',
    resumo: [
      'Nunca separe com vírgula: sujeito de verbo, verbo de complemento, nome de seu complemento.',
      'Use vírgula: para isolar aposto, vocativo, oração adjetiva explicativa, adjunto adverbial deslocado (longo: obrigatório; curto: facultativo) e conjunções intercaladas (porém, portanto, contudo).',
      'Oração adjetiva restritiva (sem vírgula) restringe; explicativa (com vírgula) generaliza. A vírgula muda o sentido.',
      'Antes de "e": em geral não se usa, exceto com sujeitos diferentes, polissíndeto ou valor adversativo.',
      'Ponto e vírgula separa orações coordenadas longas ou itens de enumeração que já têm vírgulas.'
    ],
    comoCobra: 'Pergunta qual frase está corretamente pontuada ou se a retirada/inserção de vírgulas altera o sentido.',
    pegadinhas: ['Vírgula entre sujeito longo e verbo é erro.', 'Tirar a vírgula de uma oração explicativa a transforma em restritiva (muda o sentido).'],
    mapa: { t: 'Vírgula', c: [{ t: 'Proibida', c: [{ t: 'sujeito-verbo' }, { t: 'verbo-complemento' }] }, { t: 'Obrigatória', c: [{ t: 'aposto' }, { t: 'vocativo' }, { t: 'explicativa' }, { t: 'conjunção intercalada' }] }, { t: 'Facultativa', c: [{ t: 'adjunto adverbial curto' }] }] },
    cartoes: [
      { f: 'Vírgula entre sujeito e verbo?', v: 'Proibida.' },
      { f: 'Oração adjetiva explicativa leva vírgula?', v: 'Sim; a restritiva não.' },
      { f: '"Porém" no meio da oração?', v: 'Fica entre vírgulas.' },
      { f: 'Adjunto adverbial curto no início?', v: 'Vírgula facultativa.' }
    ],
    fontes: ['Bechara, Moderna Gramática Portuguesa'], verificacao: 'gramatica'
  },
  {
    topico: 'rlm-juros', titulo: 'Juros, taxas e descontos',
    resumo: [
      'Juros simples: J = C·i·n; M = C(1 + i·n). Juros compostos: M = C(1 + i)ⁿ.',
      'Taxas proporcionais (simples): 24% a.a. = 2% a.m. Taxas equivalentes (compostas): (1 + i_anual) = (1 + i_mensal)¹².',
      'Taxa nominal com capitalização mensal: divida pelo número de períodos para achar a efetiva do período (24% a.a. cap. mensal → 2% a.m. → 26,82% a.a. efetiva).',
      'Taxa real (Fisher): (1 + aparente) = (1 + real)(1 + inflação).',
      'Desconto comercial simples (por fora): D = N·d·n. Racional simples (por dentro): A = N / (1 + i·n).',
      'Variações sucessivas: multiplique os fatores (+20% e −20% → 1,2 × 0,8 = 0,96).'
    ],
    comoCobra: 'Contas diretas com tabelas de fatores fornecidas no enunciado; a FCC dá (1,02)ⁿ e similares.',
    pegadinhas: ['Somar taxas compostas.', 'Subtrair inflação em vez de dividir.', 'Confundir desconto comercial (sobre o nominal) com racional.'],
    mapa: { t: 'Juros', c: [{ t: 'Simples', c: [{ t: 'J = Cin' }] }, { t: 'Compostos', c: [{ t: 'M = C(1+i)ⁿ' }] }, { t: 'Taxas', c: [{ t: 'nominal' }, { t: 'efetiva' }, { t: 'real (Fisher)' }] }, { t: 'Desconto', c: [{ t: 'comercial' }, { t: 'racional' }] }] },
    cartoes: [
      { f: '24% a.a. com capitalização mensal: efetiva anual?', v: '(1,02)¹² − 1 ≈ 26,82%.' },
      { f: 'Rendimento 10,25% e inflação 5%: taxa real?', v: '1,1025 ÷ 1,05 − 1 = 5%.' },
      { f: 'Desconto comercial simples?', v: 'D = N × d × n (sobre o valor nominal).' },
      { f: '+20% depois −20%?', v: '−4% (fator 0,96).' },
      { f: 'Montante composto?', v: 'M = C(1 + i)ⁿ.' }
    ],
    fontes: ['Matemática financeira: Assaf Neto; Samanez'], verificacao: 'calculado'
  },
  {
    topico: 'rlm-amortizacao', titulo: 'Sistemas de amortização e VPL',
    resumo: [
      'SAC: amortização constante (A = PV/n); juros caem; prestação decrescente. Prestação k = A + i × saldo antes dela.',
      'Price (francês): prestação constante, PMT = PV·i / [1 − (1 + i)⁻ⁿ]; juros caem e amortização cresce.',
      'No SAC, a soma total de juros é menor que na Price para o mesmo empréstimo.',
      'VPL = Σ fluxos descontados − investimento. VPL > 0: projeto rende acima da taxa mínima.',
      'TIR: taxa que zera o VPL. Payback: tempo para recuperar o investimento.'
    ],
    comoCobra: 'Pede uma parcela específica do SAC, a prestação da Price com fator dado, ou VPL de 2–3 fluxos.',
    pegadinhas: ['No SAC, a prestação NÃO é fixa.', 'Juros do período incidem sobre o saldo ANTES do pagamento.'],
    mapa: { t: 'Amortização', c: [{ t: 'SAC', c: [{ t: 'amortização fixa' }, { t: 'prestação cai' }] }, { t: 'Price', c: [{ t: 'prestação fixa' }] }, { t: 'Análise', c: [{ t: 'VPL' }, { t: 'TIR' }, { t: 'payback' }] }] },
    cartoes: [
      { f: 'O que é constante no SAC?', v: 'A amortização.' },
      { f: 'O que é constante na Price?', v: 'A prestação.' },
      { f: 'VPL positivo significa…', v: 'O projeto rende mais que a taxa de desconto.' },
      { f: 'TIR é…', v: 'A taxa que torna o VPL igual a zero.' }
    ],
    fontes: ['Assaf Neto, Matemática Financeira e suas Aplicações'], verificacao: 'calculado'
  },
  {
    topico: 'rlm-logica', titulo: 'Lógica proposicional',
    resumo: [
      'Conectivos: ∧ (e), ∨ (ou), → (se… então), ↔ (se e somente se), ~ (não).',
      'p → q só é falsa quando p é V e q é F.',
      'Equivalentes de p → q: ~q → ~p (contrapositiva) e ~p ∨ q. A recíproca (q → p) e a inversa (~p → ~q) NÃO são equivalentes.',
      'De Morgan: ~(p ∧ q) ≡ ~p ∨ ~q; ~(p ∨ q) ≡ ~p ∧ ~q.',
      'Negação de p → q: p ∧ ~q.',
      'Quantificadores: ~(Todo A é B) = Algum A não é B; ~(Algum A é B) = Nenhum A é B.'
    ],
    comoCobra: 'Negação e equivalência de frases do cotidiano, além de tabelas-verdade.',
    pegadinhas: ['Negar "todo" com "nenhum".', 'Achar que a recíproca é equivalente.', 'Negar "e" mantendo o "e".'],
    mapa: { t: 'Lógica', c: [{ t: 'Conectivos' }, { t: 'Equivalências', c: [{ t: 'contrapositiva' }, { t: '~p ∨ q' }] }, { t: 'Negações', c: [{ t: 'De Morgan' }, { t: 'p ∧ ~q' }] }, { t: 'Quantificadores' }] },
    cartoes: [
      { f: 'Negação de "Todo A é B"?', v: 'Algum A não é B.' },
      { f: 'Negação de p → q?', v: 'p ∧ ~q.' },
      { f: 'Equivalente de p → q?', v: '~q → ~p ou ~p ∨ q.' },
      { f: '~(p ∧ q)?', v: '~p ∨ ~q.' },
      { f: 'Quando p → q é falsa?', v: 'Só quando p é V e q é F.' }
    ],
    fontes: ['Lógica clássica (Copi, Introdução à Lógica)'], verificacao: 'fonte'
  },
  {
    topico: 'atu-copom', titulo: 'Política monetária: CMN, BCB e Copom',
    resumo: [
      'CMN: órgão normativo máximo; fixa a meta de inflação. Composto pelo Ministro da Fazenda, Ministro do Planejamento e Presidente do BCB.',
      'Copom: define a meta da taxa Selic; reúne-se 8 vezes por ano.',
      'Regime de metas: se a inflação esperada sobe acima da meta, a tendência é elevar a Selic.',
      'Instrumentos do BCB: taxa de juros (Selic), operações de mercado aberto, depósito compulsório, redesconto.',
      'Autonomia do BCB: Lei Complementar 179/2021 (mandatos fixos para presidente e diretores).',
      'Desde 2025 a meta é contínua (apurada em 12 meses, não mais por ano-calendário). Confira o valor e a tolerância vigentes no site do BCB.'
    ],
    comoCobra: 'Quem faz o quê (CMN × BCB × Copom) e o efeito de subir ou baixar juros.',
    pegadinhas: ['Meta de inflação é do CMN, não do Copom.', 'Selic alta tende a reduzir inflação, não aumentar.'],
    mapa: { t: 'Política monetária', c: [{ t: 'CMN', c: [{ t: 'meta de inflação' }] }, { t: 'Copom', c: [{ t: 'meta Selic' }, { t: '8 reuniões/ano' }] }, { t: 'Instrumentos', c: [{ t: 'Selic' }, { t: 'compulsório' }, { t: 'mercado aberto' }, { t: 'redesconto' }] }] },
    cartoes: [
      { f: 'Quem fixa a meta de inflação?', v: 'O Conselho Monetário Nacional (CMN).' },
      { f: 'Quem define a meta da Selic?', v: 'O Copom.' },
      { f: 'Quantas reuniões do Copom por ano?', v: 'Oito.' },
      { f: 'Lei da autonomia do BCB?', v: 'Lei Complementar 179/2021.' }
    ],
    fontes: ['bcb.gov.br (Copom e metas para a inflação)', 'LC 179/2021'], verificacao: 'conferir'
  },
  {
    topico: 'eti-pld', titulo: 'Prevenção à lavagem de dinheiro',
    resumo: [
      'Fases: colocação (entrada no sistema), ocultação (dificultar o rastro) e integração (volta com aparência lícita).',
      'Lei 9.613/1998: crimes de lavagem e obrigações das instituições (identificar clientes, manter registros, comunicar operações suspeitas ao COAF).',
      'Não avisar o cliente sobre a comunicação (vedação de tipping off). Comunicação de boa-fé não gera responsabilidade.',
      'Conheça seu cliente (KYC), funcionário (KYE) e parceiro (KYP); abordagem baseada em risco.',
      'PEP: pessoa exposta politicamente, exige diligência reforçada.',
      'Estruturação (smurfing): fracionar valores para fugir dos limites.'
    ],
    comoCobra: 'Fases da lavagem, obrigações das instituições e exemplos de operações suspeitas.',
    pegadinhas: ['A ordem das fases: colocação vem antes da ocultação.', 'A comunicação vai ao COAF, não à polícia.', 'Não se avisa o cliente.'],
    mapa: { t: 'PLD/FT', c: [{ t: 'Fases', c: [{ t: 'colocação' }, { t: 'ocultação' }, { t: 'integração' }] }, { t: 'Obrigações', c: [{ t: 'KYC' }, { t: 'registros' }, { t: 'comunicar ao COAF' }] }, { t: 'Alertas', c: [{ t: 'PEP' }, { t: 'smurfing' }] }] },
    cartoes: [
      { f: 'Três fases da lavagem, em ordem?', v: 'Colocação, ocultação e integração.' },
      { f: 'A quem comunicar operação suspeita?', v: 'Ao COAF.' },
      { f: 'O que é smurfing?', v: 'Fracionar depósitos para fugir dos limites de comunicação.' },
      { f: 'PEP exige…', v: 'Diligência reforçada.' }
    ],
    fontes: ['Lei 9.613/1998', 'Circular BCB 3.978/2020'], verificacao: 'fonte'
  }
];

export const KITS: Record<string, Kit> = Object.fromEntries(LISTA.map((k) => [k.topico, k]));
