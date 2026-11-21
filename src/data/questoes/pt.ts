import { Q } from './helper';

export const PT = [
  Q('pt01', 'pt-crase', 1, 'gramatica',
    'Está correto o emprego do sinal indicativo de crase em:',
    [
      'O analista se referiu à um problema antigo do sistema.',
      'A reunião de alinhamento foi marcada para às 14h.',
      'Os técnicos entregaram o relatório à diretora de tecnologia.',
      'Depois do treinamento, ele começou à trabalhar com APIs.',
      'O banco enviou comunicados à clientes de todo o estado.'
    ], 'C',
    'C: "entregar algo A alguém" + artigo "a" de "a diretora" = à.\nA: não há crase antes de artigo indefinido (um).\nB: "para" já é preposição; fica "para as 14h".\nD: não há crase antes de verbo.\nE: "a" no singular antes de palavra no plural (clientes) é só preposição.'),
  Q('pt02', 'pt-crase', 2, 'gramatica',
    'O sinal indicativo de crase é FACULTATIVO em:',
    [
      'Depois do congresso, o gerente voltou à Bahia.',
      'Refiro-me à sua proposta de migração para a nuvem.',
      'A videoconferência começará à uma hora da tarde.',
      'Diante do incidente, a equipe saiu às pressas.',
      'Todos os servidores assistiram à palestra sobre LGPD.'
    ], 'B',
    'B: antes de pronome possessivo feminino no singular (sua) o artigo é opcional, logo a crase é facultativa.\nA: obrigatória (quem volta, volta "da" Bahia, a palavra aceita artigo).\nC: indicação de hora: obrigatória.\nD: locução adverbial feminina (às pressas): obrigatória.\nE: "assistir" no sentido de ver exige preposição "a": obrigatória.'),
  Q('pt03', 'pt-concordancia', 1, 'gramatica',
    'A frase que respeita a concordância verbal segundo a norma-padrão é:',
    [
      'Fazem dois anos que o sistema foi implantado na agência.',
      'Houveram muitas falhas na migração dos dados.',
      'Existe, no setor de TI, muitos projetos atrasados.',
      'Vendem-se notebooks usados no setor de patrimônio.',
      'Precisam-se de analistas com experiência em Java.'
    ], 'D',
    'D: "se" apassivador; o sujeito é "notebooks usados" (notebooks usados são vendidos), por isso o verbo vai ao plural.\nA: "fazer" indicando tempo é impessoal: "Faz dois anos".\nB: "haver" no sentido de existir é impessoal: "Houve muitas falhas".\nC: "existir" concorda com o sujeito: "Existem muitos projetos".\nE: com verbo que pede preposição (precisar de), o "se" indetermina o sujeito e o verbo fica no singular: "Precisa-se de analistas".'),
  Q('pt04', 'pt-concordancia', 2, 'gramatica',
    'Está de acordo com a norma-padrão quanto à concordância nominal:',
    [
      'Seguem anexo as planilhas solicitadas pela auditoria.',
      'A analista ficou meia preocupada com o prazo da entrega.',
      'É proibida entrada de pessoas não autorizadas no CPD.',
      'Eles mesmos revisaram os códigos, e elas própria aprovaram.',
      'O relatório e a planilha foram enviados à gerência ontem.'
    ], 'E',
    'E: com núcleos de gêneros diferentes, o adjetivo posposto vai ao masculino plural (enviados).\nA: "anexo" concorda com o substantivo: "anexas as planilhas".\nB: "meio" com valor de advérbio (um pouco) é invariável: "meio preocupada".\nC: sem artigo, a expressão fica invariável: "É proibido entrada"; com artigo, "É proibida a entrada".\nD: "própria" deve concordar com "elas": "elas próprias".'),
  Q('pt05', 'pt-regencia', 2, 'gramatica',
    'A regência está correta, conforme a norma-padrão, em:',
    [
      'Prefiro trabalhar com Python do que com Java.',
      'A nova política de senhas implica em mudanças nos processos.',
      'Os servidores devem obedecer às normas de segurança da informação.',
      'O analista assistiu o treinamento sobre proteção de dados.',
      'Esqueci-me o horário da reunião com o fornecedor.'
    ], 'C',
    'C: "obedecer" é transitivo indireto (obedecer a algo) + artigo "as" = às.\nA: "preferir" pede "a": "Prefiro trabalhar com Python a trabalhar com Java".\nB: "implicar" (acarretar) é transitivo direto: "implica mudanças".\nD: "assistir" (ver) pede preposição: "assistiu ao treinamento".\nE: na forma pronominal pede "de": "Esqueci-me do horário" (ou "Esqueci o horário").'),
  Q('pt06', 'pt-pontuacao', 2, 'gramatica',
    'A pontuação está plenamente correta em:',
    [
      'Os analistas do setor de desenvolvimento, entregaram o sistema no prazo.',
      'O banco, que atua no estado há décadas, ampliou os serviços digitais.',
      'A equipe precisava de: tempo, recursos e treinamento.',
      'O gerente perguntou, se o relatório estava pronto.',
      'Analistas, programadores e gerentes participaram da reunião, e, do treinamento.'
    ], 'B',
    'B: a oração adjetiva explicativa ("que atua no estado há décadas") fica entre vírgulas.\nA: não se separa o sujeito do verbo com vírgula.\nC: não se usam dois-pontos entre a preposição e o seu complemento.\nD: não se separa o verbo da oração que é seu objeto ("se o relatório estava pronto").\nE: as vírgulas isolando o "e" quebram, sem motivo, a coordenação "da reunião e do treinamento".'),
  Q('pt07', 'pt-pronomes', 2, 'gramatica',
    'A colocação do pronome átono está de acordo com a norma-padrão em:',
    [
      'Me informaram que o sistema estava fora do ar.',
      'Não deve-se alterar o banco de produção sem autorização.',
      'Ninguém comunicou-me a mudança de horário do plantão.',
      'A equipe far-se-á presente na reunião de amanhã.',
      'Quando avisaram-nos da falha, já era tarde.'
    ], 'D',
    'D: com o verbo no futuro do presente e sem palavra atrativa, a mesóclise (far-se-á) é correta.\nA: a norma-padrão não admite iniciar frase com pronome oblíquo átono: "Informaram-me".\nB: a negação atrai o pronome: "Não se deve alterar".\nC: pronome indefinido (ninguém) atrai: "Ninguém me comunicou".\nE: conjunção subordinativa (quando) atrai: "Quando nos avisaram".'),
  Q('pt08', 'pt-reescrita', 2, 'gramatica',
    'Considere a frase: "Embora o sistema seja moderno, apresenta falhas frequentes."\nMantém o sentido e a correção a seguinte reescrita:',
    [
      'Porque o sistema é moderno, apresenta falhas frequentes.',
      'Se o sistema for moderno, apresentará falhas frequentes.',
      'O sistema é moderno; no entanto, apresenta falhas frequentes.',
      'O sistema é moderno, portanto apresenta falhas frequentes.',
      'À medida que o sistema se moderniza, apresenta falhas frequentes.'
    ], 'C',
    '"Embora" indica concessão: um fato que não impede o outro. A reescrita com oposição ("no entanto") preserva essa relação.\n"Porque" indica causa; "se", condição; "portanto", conclusão; "à medida que", proporção. Todas mudam a relação de sentido original.'),
  Q('pt09', 'pt-conectivos', 1, 'gramatica',
    'Em "A demanda por serviços digitais cresceu, visto que o uso do Pix se popularizou", o conectivo "visto que" expressa ideia de:',
    ['concessão', 'condição', 'causa', 'finalidade', 'conformidade'], 'C',
    '"Visto que" equivale a "porque", "já que": introduz a causa do crescimento.\nConcessão seria "embora"; condição, "se/caso"; finalidade, "para que"; conformidade, "conforme".'),
  Q('pt10', 'pt-verbos', 2, 'gramatica',
    'Transpondo-se para a voz passiva a frase "Os analistas revisarão os contratos de TI", a forma verbal resultante será:',
    ['eram revisados', 'serão revisados', 'seriam revisados', 'foram revisados', 'terão revisado'], 'B',
    'A voz passiva analítica mantém o tempo do verbo original no auxiliar "ser": revisarão (futuro do presente) → serão revisados ("Os contratos de TI serão revisados pelos analistas").\n"Eram" e "foram" mudam o tempo para o passado; "seriam" é futuro do pretérito; "terão revisado" continua na voz ativa.'),
  Q('pt11', 'pt-ortografia', 1, 'gramatica',
    'Está correta a grafia de todas as palavras, segundo o Acordo Ortográfico vigente, em:',
    [
      'A ideia do projeto é que os voos sejam remarcados pelo aplicativo.',
      'Os gestores podem parar o processo quando houver excessão.',
      'A assembléia aprovou o orçamento de TI do próximo ano.',
      'Ele quer pôr o arquivo na pasta, mas os usuários não vêem o atalho.',
      'O analista obteve previlégios de administrador no servidor.'
    ], 'A',
    'A: "ideia" e "voos" perderam o acento com o Acordo.\nB: o correto é "exceção".\nC: "assembleia" não tem mais acento (ditongo aberto "ei" em paroxítona).\nD: "veem" perdeu o acento (hiato "ee"); "pôr" (verbo) continua acentuado.\nE: o correto é "privilégios".'),
  Q('pt12', 'pt-pronomes', 3, 'gramatica',
    'O pronome "se" é índice de indeterminação do sujeito em:',
    [
      'Consertam-se computadores e impressoras no setor de suporte.',
      'Trata-se de questões complexas sobre segurança da informação.',
      'O técnico se feriu ao trocar o rack do servidor.',
      'Os dois gerentes se cumprimentaram antes da reunião.',
      'Ele se esqueceu do prazo de entrega do relatório.'
    ], 'B',
    'B: "tratar de" é transitivo indireto; o "se" indetermina o sujeito e o verbo fica no singular (Trata-se de questões).\nA: "se" apassivador (computadores são consertados).\nC: reflexivo (feriu a si mesmo).\nD: recíproco (um cumprimentou o outro).\nE: parte integrante do verbo pronominal "esquecer-se".'),
  Q('pt13', 'pt-concordancia', 3, 'gramatica',
    'Está correta a concordância verbal em:',
    [
      'Devem haver alternativas mais baratas para o licenciamento.',
      'Faziam meses que o servidor não era reiniciado.',
      'Podem existir soluções de código aberto para o problema.',
      'Fui eu que fez o backup da base de clientes.',
      'A maioria dos usuários, satisfeitos, aprovou; os demais reclamou.'
    ], 'C',
    'C: "existir" é pessoal e concorda com "soluções"; na locução, o auxiliar vai ao plural (Podem existir).\nA: "haver" (existir) é impessoal e passa a impessoalidade ao auxiliar: "Deve haver".\nB: "fazer" (tempo) é impessoal: "Fazia meses".\nD: com "fui eu que", o verbo concorda com "eu": "fiz".\nE: "os demais reclamaram".'),
  Q('pt14', 'pt-conectivos', 3, 'gramatica',
    'O pronome relativo está empregado de acordo com a norma-padrão em:',
    [
      'O servidor cujo o disco falhou foi substituído.',
      'Esta é a norma que nós nos referimos na reunião.',
      'O projeto que eu mais gosto foi cancelado pela diretoria.',
      'O sistema cujas falhas foram corrigidas voltou a operar.',
      'A cidade aonde moro tem boa conexão de fibra óptica.'
    ], 'D',
    'D: "cujo" concorda com o termo seguinte (falhas → cujas) e não admite artigo depois dele.\nA: "cujo o" é erro: não se usa artigo após "cujo".\nB: "referir-se a": "a norma a que nos referimos".\nC: "gostar de": "o projeto de que mais gosto".\nE: "aonde" indica movimento (ir aonde); para lugar fixo, "onde".')
];
