// Links levantados no pilar 4 (20/11/2026). Conferir se continuam no ar.
export const PROVAS: { grupo: string; nota?: string; itens: { titulo: string; url: string; status?: string; obs?: string }[] }[] = [
  {
    grupo: 'Edital e documentos oficiais',
    itens: [
      { titulo: 'Site de concursos da FCC (inscrição até 11/12/2026, boleto até 14/12/2026)', url: 'https://www.concursosfcc.com.br' },
      { titulo: 'Guia de Conduta Ética do Banestes (cai em Ética, Compliance e ESG)', url: 'https://www.banestes.com.br/institucional/pdf/guia_de_conduta_etica.pdf' }
    ]
  },
  {
    grupo: 'Prioridade 1: provas FCC de TI recentes',
    nota: 'As mais parecidas com o nível do Banestes 2027. Use no diagnóstico de 28/11 (50 de TI do TRT 20 e, se faltar, SEAD-PI).',
    itens: [
      { titulo: '2025 · TRT 1ª Região (RJ), Analista Judiciário, TI', url: 'https://www.qconcursos.com/questoes-de-concursos/provas/fcc-2025-trt-1-regiao-rj-analista-judiciario-area-apoio-especializado-especialidade-tecnologia-da-informacao', status: 'só na busca' },
      { titulo: '2025 · TRT 15ª Região (SP), Analista Judiciário, TI', url: 'https://www.qconcursos.com/questoes-de-concursos/provas/fcc-2025-trt-15-regiao-sp-analista-judiciario-area-apoio-especializado-especialidade-tecnologia-da-informacao', status: 'só na busca' },
      { titulo: '2024 · TRT 20ª Região, Analista Judiciário, TI (61 questões)', url: 'https://questoes.grancursosonline.com.br/prova/trt-20-2024-fcc-analista-judiciario-area-tecnologia-da-informacao', status: 'na listagem' },
      { titulo: '2024 · SEAD-PI, Analista, TI (71 questões)', url: 'https://questoes.grancursosonline.com.br/prova/sead-pi-pi-2024-fcc-analista-area-tecnologia-da-informacao', status: 'na listagem' },
      { titulo: '2024 · TRT 2ª Região (SP), página oficial do concurso', url: 'https://www.concursosfcc.com.br/concursos/trt2r124/index.html', status: 'só na busca' }
    ]
  },
  {
    grupo: 'Prioridade 2: provas FCC de bancos e fomento',
    nota: 'Boas para Gerais (Português, Matemática, conhecimentos bancários) e para o estilo das questões técnicas.',
    itens: [
      { titulo: '2019 · AFAP, Analista de Fomento, TI', url: 'https://www.pciconcursos.com.br/provas/download/analista-de-fomento-tecnologia-da-informacao-afap-fcc-2019', status: 'na listagem' },
      { titulo: '2019 · Banrisul, Escriturário', url: 'https://www.aprovaconcursos.com.br/questoes-de-concurso/prova/fcc-2019-banrisul-escriturario', status: 'só na busca' },
      { titulo: '2013 · Banco do Brasil, Escriturário', url: 'https://www.pciconcursos.com.br/provas/download/escriturario-banco-do-brasil-fcc-2013', status: 'na listagem' },
      { titulo: '2012 · Banese, Técnico Bancário III, Desenvolvimento (PDF)', url: 'https://arquivos.qconcursos.com/prova/arquivo_prova/29885/fcc-2012-banese-tecnico-bancario-informatica-desenvolvimento-prova.pdf', status: 'aberta' },
      { titulo: '2012 · Banese, Técnico Bancário III, Suporte', url: 'https://www.pciconcursos.com.br/provas/download/tecnico-bancario-iii-informatica-suporte-banese-fcc-2012', status: 'na listagem' },
      { titulo: '2011 · Banco do Brasil, Escriturário', url: 'https://www.pciconcursos.com.br/provas/download/escriturario-banco-do-brasil-fcc-2011', status: 'na listagem' },
      { titulo: '2010 · Banco do Brasil, Escriturário', url: 'https://www.pciconcursos.com.br/provas/download/escriturario-banco-do-brasil-fcc-2010', status: 'na listagem' },
      { titulo: '2006 · Banco do Brasil, Escriturário', url: 'https://www.pciconcursos.com.br/provas/download/escriturario-banco-do-brasil-fcc-2006', status: 'na listagem' }
    ]
  },
  {
    grupo: 'Prioridade 3: provas FCC de TI de tribunais (2014 a 2017)',
    nota: 'Cuidado: cobram versões antigas (PMBOK 5, ITIL v3, ISO 27002:2013). Use para programação, banco de dados, redes e estilo, não para decorar normas.',
    itens: [
      { titulo: 'TRT 24 (2017)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-24-fcc-2017', status: 'na listagem' },
      { titulo: 'TRT 11 (2017)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-11-fcc-2017', status: 'na listagem' },
      { titulo: 'TRT 14 (2016)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-apoio-especializado-tecnologia-da-informacao-trt-14-fcc-2016', status: 'na listagem' },
      { titulo: 'TRT 23 (2016)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-apoio-especializado-tecnologia-da-informacao-trt-23-fcc-2016', status: 'na listagem' },
      { titulo: 'TRT 3 (2015)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-3-fcc-2015', status: 'na listagem' },
      { titulo: 'TRT 4 (2015)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-4-fcc-2015', status: 'na listagem' },
      { titulo: 'TRT 9 (2015)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-apoio-especializado-tecnologia-da-informacao-trt-9-fcc-2015', status: 'na listagem' },
      { titulo: 'TRT 15 (2015)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-15-fcc-2015', status: 'na listagem' },
      { titulo: 'TRT 1 (2014)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-1-fcc-2014', status: 'na listagem' },
      { titulo: 'TRT 2 (2014)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-2-fcc-2014', status: 'na listagem' },
      { titulo: 'TRT 13 (2014)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-13-fcc-2014', status: 'na listagem' },
      { titulo: 'TRT 16 (2014)', url: 'https://www.pciconcursos.com.br/provas/download/analista-judiciario-tecnologia-da-informacao-trt-16-fcc-2014', status: 'na listagem' }
    ]
  },
  {
    grupo: 'Listas e bancos de provas',
    itens: [
      { titulo: 'PCI: provas de Analista Judiciário de TI', url: 'https://www.pciconcursos.com.br/provas/analista-judiciario-tecnologia-da-informacao' },
      { titulo: 'PCI: provas do Banestes (concursos anteriores, banca FGV)', url: 'https://www.pciconcursos.com.br/provas/banestes', obs: 'mostram o que o banco espera do cargo, não o estilo FCC' },
      { titulo: 'FGV: concurso Banestes 2021', url: 'https://conhecimento.fgv.br/concursos/banestes21' },
      { titulo: 'Gran Questões: lista de provas FCC', url: 'https://questoes.grancursosonline.com.br/provas?bancas=92&pagina=8' }
    ]
  }
];
