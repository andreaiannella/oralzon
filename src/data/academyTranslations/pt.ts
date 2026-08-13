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
    description: "Como os clientes o encontram, porque no início não o encontram, e o que pode fazer para mudar isso.",
    sections: [
      {
        heading: "O problema de quem começa: existir não basta para ser encontrado",
        paragraphs: [
          "Um catálogo carregado não é um catálogo visível. Em qualquer marketplace, os produtos que aparecem mais acima são os que já venderam, já receberam avaliações, já acumularam um histórico. É um mecanismo lógico para quem compra — mostra o que funcionou para outros — mas cria um problema circular para quem chega agora: não vende porque não o veem, e não o veem porque ainda não vendeu.",
          "É por isso que um fornecedor sério, com produtos excelentes e preços corretos, pode passar meses sem uma encomenda enquanto concorrentes menos competitivos vendem todos os dias. Não é uma questão de qualidade: é uma questão de posição. Quem procura \\\"curetas Gracey\\\" vê os primeiros resultados e raramente chega ao terceiro ecrã.",
          "As promoções servem exatamente para isto: comprar a posição que ainda não conquistou, pelo tempo necessário para a conquistar de facto. São um acelerador do início, não um imposto permanente."
        ],
      },
      {
        heading: "O que muda concretamente quando um produto está promovido",
        paragraphs: [
          "Um produto promovido não é mostrado \\\"um pouco mais acima\\\": entra em espaços onde os produtos normais não aparecem de todo. O cartão Destaque Hero, por exemplo, é um cartão único com o seu produto sozinho, sem concorrentes ao lado, que aparece na página inicial, no catálogo e nas páginas de produto — onde um cliente já está a ver artigos como os seus.",
          "A diferença face a um bom posicionamento orgânico é que a promoção age de imediato e de forma previsível: sabe onde vai aparecer e por quanto tempo. O posicionamento orgânico vem depois, como consequência das vendas que a promoção lhe permitiu fazer.",
          "E é este o ponto que muitos vendedores não percebem: as vendas geradas enquanto está promovido não desaparecem quando a promoção termina. Ficam como histórico de encomendas e como avaliações, e são precisamente os ingredientes que o fazem subir nos resultados também depois. Um mês de visibilidade paga pode deixá-lo numa posição que demoraria muito mais tempo a alcançar sozinho."
        ],
      },
      {
        heading: "Quando compensa mesmo, e quando não",
        paragraphs: [
          "Promover faz sentido quando o produto já está pronto a converter: ficha completa, fotografias nítidas, preço alinhado com o mercado, disponibilidade real em armazém. Levar tráfego a uma ficha vazia ou a um artigo esgotado é a forma mais rápida de desperdiçar o orçamento — o cliente chega, não encontra o que procura, e não volta.",
          "Faz sentido sobretudo em três momentos: quando abre a loja e ainda ninguém o conhece; quando lança um produto novo sem histórico; quando quer defender uma categoria em que um concorrente está a ganhar terreno.",
          "Faz menos sentido em produtos que já vendem bem sozinhos — aí está a pagar por visibilidade que teria de qualquer forma — e em artigos com margem demasiado baixa, onde o custo da promoção consome o lucro. Antes de comprar, faça uma conta simples: quantas unidades adicionais tem de vender para amortizar o pacote? Se o número parecer razoável, avance; se parecer alto, escolha um produto com melhor margem.",
          "As promoções não garantem vendas: compram visibilidade, que é uma condição necessária mas não suficiente. O que acontece depois do clique depende da sua ficha de produto, do seu preço e da sua fiabilidade."
        ],
      },
      {
        heading: "Meça os resultados, não confie na impressão",
        paragraphs: [
          "Antes de ativar uma promoção, registe o ponto de partida: quantas encomendas e que faturação gerou esse produto no último mês. Encontra-os na secção Estatísticas do painel. Quando o pacote expirar, compare os mesmos números — só assim sabe se funcionou mesmo, em vez de ir por sensação.",
          "Se um pacote rendeu, renove-o. Se não rendeu, experimente mudar de produto ou de tipo de visibilidade antes de concluir que as promoções não funcionam: muitas vezes o problema não é a ferramenta mas a combinação entre ferramenta e produto escolhido."
        ],
      },
      {
        heading: "O nome da loja e o selo de verificado são a sua identidade",
        paragraphs: [
          "Na Oralzon não existe logótipo nem descrição de loja para personalizar: o que um cliente vê, na página da sua loja e junto aos seus produtos, é o nome da empresa e, se o tiver, o selo de vendedor verificado. É uma escolha deliberada da plataforma — logótipo e descrição livre são os locais onde mais frequentemente se tenta inserir contactos diretos para retirar o cliente do marketplace, e eliminá-los protege todos os vendedores por igual, evitando que quem cumpre as regras concorra com quem não as cumpre.",
          "Por isso vale a pena escolher um nome de loja claro e reconhecível logo no registo: é o único elemento de identidade que o representa em toda a plataforma, incluindo nas secções promovidas onde a concorrência é mais direta.",
          "O selo de vendedor verificado não se compra: obtém-se completando a verificação de identidade na Stripe, a mesma que serve para receber os pagamentos. É o sinal de fiabilidade mais forte de que dispõe, e nas secções promovidas faz diferença: com produto e preço iguais, escolhe-se quase sempre o vendedor verificado."
        ],
      },
      {
        heading: "As avaliações são marketing, não apenas feedback",
        paragraphs: [
          "As avaliações que os clientes deixam nos seus produtos são visíveis para quem visita a página da sua loja ou as fichas de produto — são, para todos os efeitos, material gerado pelos seus próprios clientes, muitas vezes mais convincente do que qualquer descrição que possa escrever. Depois de um envio que correu bem, vale a pena pedir educadamente ao cliente que deixe uma avaliação, em vez de esperar que aconteça sozinho.",
          "As avaliações contam a dobrar se estiver a promover: a visibilidade leva o cliente à ficha, mas é a prova social que o faz carregar em \\\"adicionar ao carrinho\\\". Promover um produto sem avaliações funciona; promover um com avaliações positivas funciona muito melhor — com a mesma despesa."
        ],
      },
      {
        heading: "A página da loja reúne todo o seu catálogo",
        paragraphs: [
          "Muitos visitantes chegam a um produto através da pesquisa, mas depois clicam no nome do vendedor para ver o resto do catálogo — a página da loja é muitas vezes o ponto em que se decide se um cliente se torna habitual ou fica por uma compra única. Um catálogo organizado por categorias, com fichas completas, ajuda a reter esse visitante.",
          "É também o motivo pelo qual compensa promover o produto certo e não necessariamente o mais barato: a promoção leva tráfego a uma ficha, mas a partir daí o cliente explora tudo o resto. Um produto representativo do que vende traz visitas mais úteis do que um chamariz desligado do seu catálogo."
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