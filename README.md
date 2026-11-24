# Painel PROVA · Banestes 2027 (FCC)

App de estudo (PWA) para o cargo Analista de TI – Desenvolvimento de Sistemas. Funciona sem internet depois de aberto uma vez. Os dados ficam no aparelho (faça backup em **Mais › Configurações**).

**Abrir:** https://chirlanio1.github.io/Estudo-banestes/

## Instalar no tablet ou celular
- **Android (Chrome):** abra o link › menu ⋮ › **Instalar app** (ou "Adicionar à tela inicial").
- **iPad/iPhone (Safari):** abra o link › botão Compartilhar › **Adicionar à Tela de Início**.

## Como funciona
- Domínio por tópico estimado a cada resposta (Teoria de Resposta ao Item, com desconto do chute e do esquecimento).
- Prioridade = peso na prova × o que falta dominar × foco da semana × tempo sem prática.
- Revisão espaçada FSRS para cartões e questões.
- Cada erro pede a causa (não sabia, confundi, pegadinha, atenção, tempo) e aplica um remédio.

## Desenvolvimento
```
npm ci
npm run dev        # servidor local
npx vitest run     # testes de conteúdo
npm run build      # gera dist/
```
O conteúdo fica em `src/data/questoes/*.ts` e `src/data/kits.ts`. Cada questão tem um selo de verificação; as marcadas `conferir` dependem de norma recente e devem ser checadas na fonte oficial.

A publicação é automática: cada push no branch publicado roda `.github/workflows/deploy.yml`.

## Mesmo histórico em todos os aparelhos (Supabase, plano gratuito)
1. Crie um projeto em https://supabase.com (plano Free).
2. No **SQL Editor**, rode o conteúdo de [`docs/supabase.sql`](docs/supabase.sql).
3. Em **Authentication › Email**, desligue "Confirm email" (ou confirme pelo e-mail ao criar a conta).
4. Copie o **Project URL** e a chave pública (**anon** / **publishable**) e coloque em `src/sync/config.ts` (ou cole em Mais › Configurações em cada aparelho).
5. No app: **Criar conta** no primeiro aparelho e **Entrar** nos outros. Os históricos locais são somados na primeira entrada.

A sincronização é automática (ao abrir, a cada 3 minutos e ao sair). Sem internet, o app grava no aparelho e envia depois. Em conflito, vale a alteração mais recente.
