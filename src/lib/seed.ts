import { blankOffer, day, type Offer } from "./domain";
export function seedOffers(now: string): Offer[] {
  const entries: Partial<Offer>[] = [
    {
      name: "Meu Natal Colorido",
      niche: "Natal infantil",
      subniche: "Atividades natalinas imprimíveis",
      audience: "Pais, professores e educadores",
      price: 17.9,
      maxPrice: 27.9,
      deliverables: "Mais de 200 desenhos, moldes e atividades natalinas.",
      url: "https://moldes.site/",
      modeling:
        "Criar um kit de Natal cristão com atividades infantis, histórias bíblicas, calendário do Advento e brincadeiras em família.",
      rating: 4.5,
      reason: "Produto sazonal, visual e de aplicação imediata.",
    },
    {
      name: "Kit de Alfabetização Cadernos",
      subniche: "Alfabetização infantil",
      audience: "Professores, pedagogos e famílias",
      price: 10.9,
      deliverables: "6 cadernos digitais.",
      url: "https://saberdidatico.com.br/produto/kit-de-alfabetizacao-abc-facil",
      modeling:
        "Criar um kit de alfabetização para crianças com dificuldades nas primeiras sílabas, dividido por níveis de aprendizagem.",
      notes: "Preço anunciado no Pix.",
    },
    {
      name: "26 Apostilas de Alfabetização",
      subniche: "Materiais pedagógicos",
      audience: "Professores alfabetizadores",
      price: 19.9,
      deliverables: "26 apostilas e mais de 600 páginas.",
      url: "https://lojinhadocantinhoensinar.com.br/produto/26-apostilas-de-alfabetizacao/",
      modeling:
        "Criar um pacote de alfabetização organizado em planos semanais, com atividades imprimíveis e orientações para professores.",
      rating: 4,
      reason: "Grande volume de materiais e público bem definido.",
    },
    {
      name: "Combo Alfabetização",
      subniche: "Jogos de alfabetização",
      audience: "Professores e educadores",
      price: 19.9,
      deliverables: "4 materiais digitais.",
      url: "https://saberdidatico.com.br/kit/combo-alfabetizacao",
      modeling:
        "Criar um kit de jogos fonéticos e atividades manipuláveis para aulas de reforço escolar.",
    },
    {
      name: "Brincando com as Letras",
      subniche: "Alfabetização lúdica",
      audience: "Professores do primeiro ano",
      price: 14.9,
      deliverables: "37 páginas com jogos e fichas.",
      url: "https://www.professorlandia.com.br/produto/kit-alfabetizacao-brincando-com-as-letras",
      modeling:
        "Criar jogos de alfabetização organizados em estações de aprendizagem para pequenos grupos.",
    },
    {
      name: "Vogais e Letras: 100 Atividades",
      subniche: "Alfabetização infantil",
      audience: "Professores e pais",
      price: 19.9,
      deliverables: "100 atividades em PDF.",
      url: "https://boraensinarbrincando.professorlandia.com.br/produto/kit-alfabetizacao-2",
      modeling:
        "Criar um kit de desafios diários de alfabetização com atividades de 10 minutos e acompanhamento de progresso.",
      notes:
        "A pesquisa anterior identificou uma venda exibida na plataforma; isso não comprova escala.",
    },
    {
      name: "Receita Amigurumi Sino de Natal",
      niche: "Artesanato",
      subniche: "Crochê e amigurumi natalino",
      audience: "Artesãs e pessoas que trabalham com crochê",
      price: 15.9,
      deliverables: "Receita ilustrada em PDF.",
      url: "https://www.triarte.com.br/receitas-de-amigurumi",
      modeling:
        "Criar uma coleção autoral de enfeites natalinos de crochê, com receitas ilustradas para iniciantes.",
      notes:
        "O link informado é de catálogo. Página individual não verificada.",
    },
    {
      name: "Coletânea de Dinâmicas de Grupo",
      niche: "Materiais profissionais",
      subniche: "Dinâmicas e atividades para grupos",
      audience:
        "Psicólogos, terapeutas, coordenadores de grupos e profissionais de RH",
      price: 29.9,
      deliverables: "45 dinâmicas, guia e 10 modelos.",
      url: "https://psifllux.com/br/materiais/coletanea-dinamicas-grupo/",
      modeling:
        "Criar um kit de dinâmicas para RH, integração de equipes e desenvolvimento profissional, com roteiros editáveis.",
      rating: 4.2,
      reason:
        "Público profissional específico e material de aplicação prática.",
    },
  ];
  return entries.map((e, i) => ({
    ...blankOffer(),
    ...e,
    id: `sprezz-${i + 1}`,
    discoveredAt: day(new Date(now)),
    createdAt: now,
    updatedAt: now,
  }));
}
