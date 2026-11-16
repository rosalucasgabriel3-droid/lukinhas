# SPREZZ MINER

Plataforma de inteligência de ofertas low ticket para o mercado brasileiro. Interface dark, verde neon, português brasileiro e preços em reais. Primeira versão para um workspace privado, com dados persistidos no servidor.

## Executar

Requer **Node.js 24 LTS** (o banco usa `node:sqlite`) e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra **http://localhost:3000**. O banco `data/sprezz.sqlite` é criado no primeiro acesso à API. As oito referências do briefing são inseridas uma única vez, com a data real de cadastro. Excluir ofertas não recria o seed. Nenhum dado do navegador é necessário para persistir os registros.

A cópia local de desenvolvimento funciona sem senha. Defina `APP_PASSWORD` em `.env.local` para proteger o workspace. O navegador solicitará usuário e senha; qualquer usuário é aceito, e a senha deve corresponder ao valor configurado.

```bash
npm test
npm run typecheck
npm run build
npm run test:production
npm start
```

**Produção exige `APP_PASSWORD`**; sem ela, a aplicação responde 503. Use HTTPS em hospedagem. `ALLOW_UNAUTHENTICATED=true` é uma opção explícita para ambientes isolados de teste, nunca uma configuração pública recomendada.

## Funcionalidades

- Dashboard com total ativo, escala verificada, cadastros de hoje em Brasília e nicho predominante calculados do banco.
- Oito ofertas iniciais, preços e entregáveis informados no briefing; cinco de educação, uma de Natal infantil, uma de artesanato e uma de materiais profissionais.
- Catálogo com cards/lista, busca, filtros combináveis (nicho, subnicho, preço, nota, status, cadastro, favoritos e arquivadas) e cinco ordenações.
- URLs individuais `/ofertas/:id`, com informações comerciais, anúncios, funil, modelagem e status de cada informação.
- Favoritar, cadastrar, editar, arquivar, restaurar e excluir, com persistência SQLite e histórico com snapshots dos registros.
- Formulário completo com validação no servidor: URLs HTTP/HTTPS, faixa R$ 9,90–97, notas 0–5, contagens inteiras e datas sem valores futuros.
- Evidências por critério com fonte, data, observação e print. Upload de PNG, JPEG e WebP, até 2 MB por imagem. Até oito anexos gerais por oferta.
- Rankings qualitativos geral e diário; visualização separada para sinais de escala. Notas iniciais 4,5, 4,2 e 4,0, sem notas fabricadas para as demais ofertas.
- Gráfico por nicho e evolução de cadastros dos últimos 14 dias, sem extrapolação de tendências de mercado.
- Histórico, meta manual de até dez descobertas por dia, contagem de aprovadas por evidências e pendentes.
- Importação JSON atômica (1–100 ofertas, até 30 MB), exportação completa e modelo de importação em Configurações.
- Links de pesquisa manual na Meta e termos prioritários. Nenhum anúncio individual inventado.
- Interface responsiva, navegação por teclado, diálogo acessível Radix, estados vazios, carregamento, mensagens de erro e suporte a movimento reduzido.

## Integridade dos dados

**Todas as ofertas iniciais começam sem escala verificada.** Não foram realizadas pesquisas externas para confirmar checkout, anúncios, plataforma, criativos, order bumps ou upsells. Preços e entregáveis iniciais são dados fornecidos, não observações independentes. Imagens de capa são composições genéricas explicitamente identificadas como ilustrativas; prints reais só aparecem quando anexados pelo usuário.

O status de escala é calculado, nunca selecionado manualmente. Exige pelo menos **dois critérios distintos**, com evidência datada (URL ou print) e os respectivos campos compatíveis:

1. Dez ou mais anúncios ativos registrados.
2. Anúncio ativo mais antigo há pelo menos 14 dias e ao menos um anúncio ativo registrado.
3. Criativos duplicados observados.
4. Pelo menos dois anunciantes registrados.
5. Página e checkout com URLs registradas, preço do checkout informado e evidência de funcionamento.

A aplicação valida o formato e a consistência dos registros; a autenticidade e o conteúdo das fontes são conferidos manualmente pelo pesquisador. Registrar um campo não equivale a verificá-lo. Anúncios ativos não comprovam vendas. Não existem métricas de faturamento, vendas estimadas ou coleta simulada.

As notas e todas as sugestões de modelagem são hipóteses qualitativas, separadas de dados comerciais. Dados desconhecidos ficam como “Não verificado”. As datas de descoberta, cadastro e última verificação têm campos separados.

## Arquitetura

- Next.js App Router, React, TypeScript e Tailwind CSS 4.
- Button no padrão shadcn/ui (CVA, Slot, clsx e tailwind-merge), Radix Dialog, Lucide e Recharts.
- `src/lib/domain.ts`: tipos, normalização, validação e regras de escala.
- `src/lib/seed.ts`: oito referências, sem evidências ou contagens inventadas.
- `src/lib/db.ts`: persistência e transações. Entidades `offers`, `niches`, `evidence`, `links`, `images`, `favorites`, `opportunity_notes` e `verification_history`.
- `src/app/api/store/route.ts`: API sem cache, validação de origem nas escritas e limite de payload.
- `src/proxy.ts`: proteção do workspace e da API por senha do servidor.
- `src/components/`: dashboard, formulário, detalhes, ilustrações e componentes reutilizáveis.

Os registros completos são mantidos em JSON e projetados nas tabelas relacionadas dentro da mesma transação. Os snapshots de verificação preservam o estado enviado em cada alteração e exclusão. Imagens são armazenadas em base64 no SQLite nesta primeira versão. O histórico exibido limita-se aos últimos 1.000 eventos; os registros anteriores permanecem no banco.

## Importação e backup

Em **Configurações → Baixar modelo de importação**, obtenha o formato mínimo. Também é possível importar um array de ofertas ou `{ "offers": [...] }`.

- Uma URL normalizada só pode pertencer a uma oferta, inclusive arquivada. A normalização remove âncoras, barra final, `utm_*`, `fbclid` e `gclid`, e ordena os parâmetros restantes.
- IDs existentes ou repetidos no arquivo são rejeitados. IDs ausentes são gerados pelo servidor. Importar não sobrescreve dados existentes.
- Para adicionar novas ofertas a partir de uma exportação, remova seus IDs e use páginas de vendas distintas. Para restaurar IDs de uma exportação, o banco de destino precisa estar sem as ofertas correspondentes.
- Cadastro e atualização recebem timestamps do servidor. A data de descoberta informada pode ser preservada; a data de cadastro reflete a importação atual.
- Qualquer item inválido ou duplicado cancela o lote inteiro, sem importação parcial.

A exportação JSON inclui ofertas, favoritos, anexos e evidências. **Não é backup do histórico de auditoria.** Para backup completo, pare o servidor e copie o diretório `data/` inteiro (incluindo arquivos WAL, se presentes), ou use a API de backup do SQLite.

## Hospedagem

Esta versão precisa de um **servidor Node.js com disco/volume persistente**, em uma única instância. SQLite não deve ser usado em um filesystem efêmero ou compartilhado por réplicas. Configure `DATABASE_PATH` se necessário.

```bash
docker build -t sprezz-miner .
docker run --env-file .env.production -p 3000:3000 -v sprezz-data:/app/data sprezz-miner
```

Crie `.env.production` fora do Git com `APP_PASSWORD` definido. O volume `sprezz-data` preserva o banco entre reinicializações. Publique atrás de um proxy HTTPS.

O projeto não usa exportação estática: cadastro, evidências e favoritos dependem de API e banco. A publicação pelo plugin Sites não foi concluída neste ambiente: os helpers de preparação/empacotamento exigidos não estão instalados, e a API Node/SQLite desta versão precisa de adaptação para Cloudflare Workers/D1. Não existe URL pública de produção criada para esta entrega.

## Integrações futuras

- **Mineração automática:** depende de uma fonte autorizada e tecnicamente disponível. Nenhum agendamento ou pesquisa automática é executado.
- **Supabase/PostgreSQL:** opcional para hospedagem distribuída, contas individuais e acesso multiusuário. Não é necessário para executar a versão atual, e nenhuma credencial Supabase foi incluída.
- **Storage de objetos:** recomendado para grandes volumes de prints; a primeira versão usa o banco local.
- **Validação remota de páginas/anúncios:** não implementada. URLs são validadas sintaticamente, não acessadas automaticamente.
- **Autenticação individual:** a senha atual protege um workspace compartilhado; ainda não há contas, papéis ou favoritos por usuário.

## Verificação

`npm test` cobre seed, distribuição, ausência de escala, normalização e duplicatas, validação de entradas, regras de evidência, persistência, importação atômica e histórico após exclusão. O smoke test de produção sobe servidores temporários com banco isolado e confere autenticação, rotas, proteção de origem e bloqueio sem senha. O build e o TypeScript também são verificados no workflow de CI.

Fluxos conferidos também no Chromium: filtros combinados, favoritos após reload, cadastro, edição, rota individual, evidências e escala calculada, arquivamento/restauração, exclusão, histórico e navegação mobile, sem erros de JavaScript e sem overflow horizontal em 1440 px e 390 px.
