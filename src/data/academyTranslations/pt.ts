import type { AcademyGuideSection } from '../academyGuides';
import type { AcademyGuideTranslation } from './en';

export const PT_ACADEMY_TRANSLATIONS: Record<string, AcademyGuideTranslation> = {
  "come-iniziare-su-oralzon": {
    title: "Como começar na Oralzon",
    description: "O percurso essencial dos primeiros dias: o que completar antes de abrir realmente ao público, e por que ordem.",
    sections: [
      {
        heading: "O perfil da loja em primeiro lugar",
        paragraphs: [
          "Antes de carregar produtos, vale a pena completar o perfil em Definições: nome da loja, telefone, site (se tiver um), e os dados fiscais (NIF, PEC ou código SDI) necessários para a faturação. Não há logótipo nem descrição para carregar — na Oralzon a identidade do vendedor é o nome da loja mais o eventual selo de vendedor verificado, não uma imagem."
        ],
      },
      {
        heading: "Ligar o Stripe antes de publicar produtos",
        paragraphs: [
          "A conta Stripe ligada é a que recebe realmente os pagamentos das vendas — sem ela, um produto pode ser publicado e até comprado, mas os fundos ficam pendentes na Oralzon até a ligação ser concluída. A página Pagamentos mostra sempre o estado atualizado da ligação, e um banner no topo do painel lembra-o enquanto não estiver ativa."
        ],
      },
      {
        heading: "Os primeiros produtos: qualidade antes de quantidade",
        paragraphs: [
          "Mais vale 10-15 produtos com fichas completas (várias fotos, descrição detalhada, categoria correta) do que 50 fichas mínimas. As fichas incompletas posicionam-se pior na pesquisa interna e convertem menos — um cliente que procura uma ferramenta específica e encontra uma descrição vaga passa quase sempre ao resultado seguinte.",
          "A importação a partir de Excel (secção Import Excel) é útil quando se parte de um catálogo já existente numa folha de cálculo, mas mesmo assim vale a pena rever à mão as primeiras fichas importadas antes de as publicar: a qualidade das fotos, em particular, não se pode automatizar."
        ],
      },
      {
        heading: "O que acontece nos primeiros 6 meses",
        paragraphs: [
          "O período de teste gratuito dura 180 dias a partir do registo — durante este período não se paga a mensalidade do plano de vendedor, mas a comissão sobre as vendas mantém-se ativa desde a primeira encomenda. Vale a pena usar estes meses para testar o que funciona (categorias, preços, patrocínios) antes de a mensalidade começar a ser cobrada."
        ],
      },
    ],
  },
  "migliorare-le-vendite": {
    title: "Melhorar as vendas: o que realmente move os números",
    description: "As alavancas com impacto real nas vendas, por ordem de prioridade prática — nem tudo merece o mesmo esforço.",
    sections: [
      {
        heading: "As fotos importam mais do que a descrição",
        paragraphs: [
          "Num marketplace B2B, a tentação é escrever descrições técnicas muito longas e negligenciar as fotos, presumindo que quem compra já sabe o que procura. Na prática acontece o contrário: as fotos são o primeiro filtro com que um comprador descarta ou considera um produto, a descrição só entra em jogo depois. Fotos nítidas, sobre fundo neutro, mostrando o produto de vários ângulos, fazem uma diferença mensurável na taxa de conversão."
        ],
      },
      {
        heading: "O preço não é a única alavanca competitiva",
        paragraphs: [
          "Num marketplace com vários vendedores na mesma categoria de produto, a tentação é competir apenas pelo preço mais baixo — mas prazos de envio declarados com honestidade, uma ficha de produto completa e avaliações positivas acumuladas ao longo do tempo pesam tanto ou mais do que o preço para um comprador profissional que avalia a fiabilidade do fornecedor, não apenas o custo da encomenda."
        ],
      },
      {
        heading: "Responder às avaliações, mesmo às negativas",
        paragraphs: [
          "Na secção Avaliações pode responder publicamente a cada avaliação — a sua resposta fica visível por baixo da do cliente. Uma avaliação negativa sem resposta pesa mais do que a própria avaliação: comunica que o problema não foi resolvido. Uma resposta pública, ainda que breve, que reconhece o problema e explica o que foi feito, recupera grande parte da confiança perdida."
        ],
      },
      {
        heading: "Os patrocínios funcionam melhor em produtos já validados",
        paragraphs: [
          "Patrocinar um produto que ainda não vendeu nada, para testar se funciona, é quase sempre menos eficiente do que patrocinar um produto que já vende bem organicamente — o patrocínio amplifica a visibilidade, não compensa uma ficha fraca ou um preço fora do mercado. Vale a pena olhar as estatísticas antes de escolher o que patrocinar, não depois."
        ],
      },
    ],
  },
  "fatturazione-e-dati-fiscali": {
    title: "Faturação: o que a Oralzon faz e o que fica a cargo do vendedor",
    description: "Como funciona realmente o cálculo do IVA linha a linha, o que encontra no relatório de vendas, e o que ainda tem de fazer você mesmo.",
    sections: [
      {
        heading: "A Oralzon não emite faturas em seu nome",
        paragraphs: [
          "Um ponto importante a ter claro desde o início: a Oralzon não é responsável pela emissão das faturas fiscais reais. Cada vendedor continua a ser um sujeito fiscal autónomo, e deve emitir as suas próprias faturas eletrónicas (ou através do seu contabilista) para cada encomenda. O que a Oralzon fornece, na secção Relatório de Vendas → Dados para faturação, é o cálculo já pronto — valor tributável, taxa, IVA, eventual motivo de isenção — para que não seja preciso recalculá-lo à mão."
        ],
      },
      {
        heading: "Como é calculado o IVA em cada encomenda",
        paragraphs: [
          "O cálculo segue a regra padrão da UE para as entregas de bens B2B: venda nacional (mesmo país de vendedor e cliente) aplica o IVA integral do país do vendedor; venda intracomunitária com ambas as partes verificadas no VIES aplica a inversão do sujeito passivo (IVA a zero, o cliente autoliquida o imposto); venda intracomunitária sem verificação VIES aplica na mesma o IVA integral, por prudência; venda extra-UE é isenta como exportação.",
          "Este cálculo é feito automaticamente para cada linha de encomenda, no momento da compra — não é preciso configurar nada para que funcione."
        ],
      },
      {
        heading: "Exportar os dados para o contabilista",
        paragraphs: [
          "O botão Exportar CSV na secção Dados para faturação gera um ficheiro com uma linha para cada produto de cada encomenda — o nível de detalhe realmente necessário para preparar uma fatura, não um agregado mensal. É o ficheiro mais prático para entregar ao seu contabilista ou usar como base para a emissão das faturas eletrónicas."
        ],
      },
    ],
  },
  "marketing-su-oralzon": {
    title: "Marketing na Oralzon",
    description: "O que realmente influencia a forma como os clientes o encontram e confiam em si na plataforma.",
    sections: [
      {
        heading: "O nome da sua loja e o selo de verificado são a sua identidade",
        paragraphs: [
          "Na Oralzon não há logótipo nem descrição de loja para mostrar — o que um cliente vê, na página da sua loja e junto aos seus produtos, é o nome do negócio e o eventual selo de vendedor verificado. Vale a pena escolher um nome de loja claro e reconhecível desde o registo: é o único elemento de identidade que o representa em toda a plataforma."
        ],
      },
      {
        heading: "As avaliações são marketing, não apenas feedback",
        paragraphs: [
          "As avaliações que os clientes deixam nos seus produtos são visíveis para qualquer pessoa que visite a página da sua loja ou as fichas de produto — são, na prática, material gerado pelos seus próprios clientes, muitas vezes mais convincente do que qualquer descrição que possa escrever. Vale a pena, depois de um envio que correu bem, pedir gentilmente ao cliente que deixe uma avaliação, em vez de esperar que isso aconteça sozinho."
        ],
      },
      {
        heading: "A página da sua loja reúne todo o seu catálogo",
        paragraphs: [
          "Muitos visitantes chegam a um produto através da pesquisa, mas depois clicam no nome do vendedor para ver o resto do catálogo — a página da loja (em /negozio/venditore/[id]) é frequentemente o ponto em que se decide se um cliente se torna habitual ou permanece uma compra única. Um catálogo organizado por categorias, com fichas de produto completas, ajuda a reter esse visitante."
        ],
      },
    ],
  },
  "sconti-e-codici-sconto": {
    title: "Descontos e códigos de desconto",
    description: "Como criar um código de desconto eficaz, e um ponto importante a saber se vende num carrinho partilhado com outros vendedores.",
    sections: [
      {
        heading: "Como criar um código de desconto",
        paragraphs: [
          "Na secção Descontos pode criar um código personalizado, em percentagem ou em valor fixo, com um limite de utilizações e uma data de validade opcionais, e — se quiser — limitá-lo a produtos específicos em vez de a todo o catálogo. O código é comunicado por si aos clientes (email, redes sociais, cartão de visita) — a Oralzon não o publicita automaticamente em lado nenhum."
        ],
      },
      {
        heading: "Importante: o seu código aplica-se apenas aos seus produtos",
        paragraphs: [
          "A Oralzon é um marketplace multi-vendedor: um cliente pode ter no carrinho produtos seus juntamente com produtos de outros vendedores na mesma encomenda. Um ponto fundamental a ter claro: um código de desconto que crie aplica-se exclusivamente às linhas da sua loja nesse carrinho, nunca aos produtos de outro vendedor. Nenhum vendedor pode, mesmo por engano, reduzir involuntariamente a margem de outro através do seu próprio código de desconto."
        ],
      },
      {
        heading: "Um limite mínimo razoável",
        paragraphs: [
          "Definir um valor mínimo de encomenda para usar o código (por exemplo, \"válido acima de 50€\") é muitas vezes mais eficaz do que um desconto pequeno sem limite: incentiva o cliente a adicionar algo mais ao carrinho para atingir o limite, em vez de se limitar à compra mínima que já tinha em mente."
        ],
      },
    ],
  },
  "come-usare-le-sponsorizzazioni": {
    title: "Como usar os patrocínios",
    description: "As opções disponíveis em Promoções, e como escolher a certa consoante o que quer alcançar.",
    sections: [
      {
        heading: "Quatro tipos de visibilidade, quatro objetivos diferentes",
        paragraphs: [
          "Produtos em Destaque coloca até 5 dos seus produtos na página inicial e nos resultados de pesquisa — a escolha certa quando quer dar um impulso a produtos específicos, talvez novidades ou artigos com melhor margem. Patrocínio da Página Inicial dá-lhe uma posição rotativa ou fixa na secção de patrocinados da página inicial — mais adequado para construir reconhecimento da sua loja como um todo, não de um único produto. Patrocínio de Categoria dá-lhe visibilidade privilegiada numa ou várias categorias à escolha — útil se quiser ser notado por quem já está à procura precisamente do tipo de produto que vende. Patrocinado Hero coloca-o sozinho, sem outros produtos à volta, num cartão em destaque contextual à categoria que o cliente está a ver naquele momento — aparece em vários pontos entre a página inicial, o catálogo e a página de produto."
        ],
      },
      {
        heading: "Patrocinado Hero: nunca mais de um seu de cada vez",
        paragraphs: [
          "Pode comprar este pacote para quantos produtos quiser — não há limite de quantos pode ter patrocinados. O limite diz respeito ao que o cliente vê num determinado momento: na mesma página nunca aparece mais de um produto seu ao mesmo tempo, mesmo que tenha patrocinado vários — o sistema faz rodar qual dos seus produtos mostrar, tanto ao longo do tempo como entre os vários pontos da página inicial onde este formato aparece. Isto garante que o espaço continua repartido de forma justa entre todos os patrocinadores, sem ser monopolizado por quem compra mais."
        ],
      },
      {
        heading: "Veja as estatísticas antes de escolher o que patrocinar",
        paragraphs: [
          "A secção Estatísticas mostra quais os produtos que já estão a gerar visualizações e vendas orgânicas — são geralmente os melhores candidatos a patrocinar, porque o patrocínio amplifica um interesse que já existe em vez de ter de o criar do zero. Patrocinar um produto que não vende nada raramente inverte a tendência por si só."
        ],
      },
      {
        heading: "O código de desconto no checkout do patrocínio",
        paragraphs: [
          "Se tiver um código de desconto válido para os pacotes de visibilidade, insere-o no passo de confirmação que se abre ao clicar em \"Comprar\" num pacote específico — não antes. O preço final com o desconto aplicado é o que vê imediatamente antes de avançar para o pagamento, nunca uma surpresa depois."
        ],
      },
    ],
  },
};