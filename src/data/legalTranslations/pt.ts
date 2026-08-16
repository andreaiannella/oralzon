import type { LegalDocument } from '../legalContent';

/**
 * Versão portuguesa dos textos legais (português europeu).
 *
 * Duas decisões de tradução deliberadas:
 *
 * 1. Os dados da entidade gestora limitam-se por ora a "Oralzon", sem
 *    denominação social, sede e NIF. É uma decisão provisória
 *    deliberada: os dados existem e devem ser inseridos.
 *    Ver docs/dati-societari-mancanti.md.
 *
 * 2. As remissões para o Direito italiano (Código do Consumo, Código Civil,
 *    Tribunal de Cassino) NÃO são substituídas pelos equivalentes
 *    portugueses: são identificadas expressamente como Direito italiano. O
 *    contrato rege-se pela lei italiana (ponto 11); transpô-las para o
 *    ordenamento português seria materialmente falso e criaria expectativas
 *    erradas.
 */

const TERMINI_SERVIZIO_PT: LegalDocument = {
  title: "Condições de Serviço",
  lastUpdated: "Agosto de 2026",
  sections: [
    {
      heading: "1. Quem somos e o que regulam estas condições",
      paragraphs: [
        "A Oralzon é um serviço de intermediação em linha que coloca em contacto fornecedores de produtos dentários (**vendedores**) com operadores profissionais do setor (**compradores**). A Oralzon não vende produtos próprios aos compradores através do serviço de intermediação: cada contrato de compra e venda é celebrado diretamente entre o vendedor e o comprador.",
        "A entidade que explora a plataforma é **Oralzon**, contactável em support@oralzon.com.",
        "Ao utilizar a plataforma aceita estas Condições. Se não as aceitar, não pode utilizá-la. As Condições de Venda, a Política de Privacidade e a Política de Cookies fazem parte integrante das mesmas."
      ],
    },
    {
      heading: "2. Quem pode utilizar a Oralzon",
      paragraphs: [
        "A Oralzon está reservada a sujeitos que atuem no exercício da sua atividade profissional ou empresarial e sejam titulares de um número de IVA válido. Não se dirige a consumidores: por conseguinte, **não são aplicáveis as proteções do Código do Consumo italiano** (D.Lgs. 206/2005), que dizem respeito exclusivamente a pessoas singulares que atuem para fins alheios à sua atividade.",
        "Os vendedores devem estar estabelecidos num dos 27 Estados-Membros da União Europeia. Este requisito decorre das regras de IVA relativas ao fornecedor presumido (art. 14.º-A da Diretiva 2006/112/CE) e não é derrogável.",
        "É responsável pela veracidade dos dados fornecidos, pela guarda das suas credenciais e por tudo o que ocorra através da sua conta."
      ],
    },
    {
      heading: "3. Alterações a estas condições",
      paragraphs: [
        "Podemos alterar estas Condições. As alterações são comunicadas aos vendedores por correio eletrónico e publicadas na plataforma **pelo menos 15 dias antes** de produzirem efeitos, conforme previsto no art. 3.º do Regulamento (UE) 2019/1150. Se a alteração exigir adaptações técnicas ou comerciais significativas, o pré-aviso é proporcionalmente mais longo.",
        "Durante o período de pré-aviso o vendedor pode resolver o contrato sem custos. A publicação de novos produtos ou a ausência de denúncia dentro do prazo valem como aceitação.",
        "O pré-aviso não se aplica quando a alteração seja imposta por obrigação legal ou vise fazer face a um perigo iminente para a segurança da plataforma ou dos seus utilizadores."
      ],
    },
    {
      heading: "4. Como os produtos são ordenados (posicionamento)",
      paragraphs: [
        "Em aplicação do art. 5.º do Regulamento (UE) 2019/1150 indicamos os principais parâmetros que determinam a posição dos produtos nos resultados de pesquisa e nas secções da plataforma, bem como a sua importância relativa."
      ],
      bullets: [
        "**Correspondência com a pesquisa** — é o parâmetro predominante: a pesquisa textual compara o termo introduzido com o nome, a marca e a referência do produto",
        "**Filtros e ordenação escolhidos pelo comprador** — quando o comprador ordena por preço ou por data, essa escolha prevalece sobre qualquer outro parâmetro, incluindo as posições pagas",
        "**Disponibilidade e estado do produto** — os produtos não publicados ou de vendedores suspensos não aparecem",
        "**Posicionamento pago** — os vendedores podem adquirir pacotes de visibilidade (produtos em destaque, espaços na página inicial, espaços por categoria, cartões contextuais). Estes conteúdos são **sempre identificados como «Patrocinado»** e a sua posição depende exclusivamente da aquisição do pacote, não de um juízo de qualidade sobre o produto. Quando um espaço pago está disponível mas nenhum vendedor o adquiriu, mostramos um produto não patrocinado com a etiqueta neutra «Em destaque», sem lhe atribuir um patrocínio inexistente",
        "**Histórico de compra e de navegação do comprador** — utilizado para sugerir produtos pertinentes, com dados recolhidos unicamente nesta plataforma. Não incide em preços ou condições e nunca prevalece sobre as escolhas explícitas do comprador nem sobre os espaços pagos",
        "**Vendas realizadas e avaliações recebidas** — nas secções dedicadas aos produtos mais vendidos"
      ],
    },
    {
      heading: "5. Obrigações dos vendedores",
      bullets: [
        "Ser sujeitos jurídicos regularmente constituídos, com número de IVA válido num Estado-Membro da União Europeia",
        "Publicar informação de produto completa, exata e não enganosa, incluindo as menções obrigatórias por lei",
        "Garantir que os produtos classificados como dispositivos médicos cumprem o Regulamento (UE) 2017/745 (MDR) e demais legislação aplicável",
        "Manter atualizadas as disponibilidades de existências e satisfazer as encomendas recebidas nos prazos declarados",
        "Assegurar o envio dos seus produtos e introduzir os dados de rastreio",
        "Utilizar os dados dos compradores exclusivamente para satisfazer a encomenda, respeitando o RGPD",
        "**Não encaminhar os compradores para fora da plataforma**: é proibido inserir contactos diretos (correio eletrónico, telefone, mensagens, sítios de terceiros) nas fichas de produto, nas respostas a perguntas, nas avaliações, nas imagens ou nos materiais incluídos nas expedições, com o objetivo de concluir fora da Oralzon vendas originadas na plataforma",
        "Cumprir por si próprio todas as obrigações fiscais, incluindo as declarações recapitulativas das transmissões intracomunitárias (Intrastat) quando devidas: a Oralzon não as apresenta por conta do vendedor"
      ],
    },
    {
      heading: "6. Limitação, suspensão e cessação do serviço",
      paragraphs: [
        "Em aplicação do art. 4.º do Regulamento (UE) 2019/1150, quando limitamos ou suspendemos os serviços a um vendedor comunicamos-lhe **os motivos concretos** da decisão, em suporte duradouro, o mais tardar no momento em que a medida produz efeitos.",
        "Se decidirmos cessar totalmente a prestação dos serviços, o pré-aviso é de **pelo menos 30 dias**, salvo se existir uma obrigação legal, uma violação grave e reiterada destas Condições, ou um risco concreto para a segurança dos utilizadores ou para a integridade do serviço.",
        "O vendedor pode contestar a decisão através do procedimento de reclamação do ponto 7. Se a contestação for julgada procedente, a medida é revogada sem demora indevida.",
        "O termo do período experimental ou do plano de vendedor, quando não renovado, não é uma sanção: rege-se pelas Condições de Venda e é precedido dos respetivos avisos.",
        "**As encomendas já recebidas antes de uma suspensão mantêm-se válidas** e devem ser satisfeitas. Os montantes correspondentes são creditados nas condições ordinárias."
      ],
    },
    {
      heading: "7. Reclamações e resolução de litígios",
      paragraphs: [
        "Qualquer vendedor pode apresentar uma reclamação escrevendo para **support@oralzon.com**, indicando o objeto da contestação. Tratamos as reclamações em prazos razoáveis e proporcionais à sua complexidade, e comunicamos o resultado de forma individual e em linguagem clara.",
        "A entidade que explora a plataforma é atualmente uma pequena empresa na aceção do art. 11.º, n.º 5, do Regulamento (UE) 2019/1150, não estando por isso obrigada a instituir um sistema interno formalizado de gestão de reclamações. Mantemos, ainda assim, o procedimento acima descrito.",
        "Na falta de acordo, as partes podem recorrer, por via extrajudicial, a um organismo de mediação inscrito no registo mantido pelo Ministério da Justiça italiano e competente em matéria comercial. O recurso à mediação não prejudica o direito de recorrer aos tribunais.",
        "Ficam ressalvados os direitos reconhecidos às organizações representativas dos vendedores pelo art. 14.º do mesmo Regulamento."
      ],
    },
    {
      heading: "8. Acesso aos dados",
      paragraphs: [
        "O vendedor tem acesso, a partir da sua área reservada, aos dados gerados pela sua atividade: encomendas recebidas, produtos vendidos, faturação, avaliações, perguntas dos clientes, transferências e resumos fiscais.",
        "Não partilhamos com os vendedores o correio eletrónico nem o número de telefone dos compradores. Recebem, em contrapartida, nome, morada de entrega e dados de faturação, necessários para entregar e emitir fatura. Esta opção protege os compradores de comunicações não solicitadas e mantém as trocas rastreáveis em caso de litígio.",
        "Não cedemos a terceiros os dados agregados gerados na plataforma para as finalidades comerciais próprias destes."
      ],
    },
    {
      heading: "9. Propriedade intelectual e conteúdos",
      paragraphs: [
        "O vendedor conserva todos os direitos sobre os conteúdos que publica e garante ser titular dos mesmos. Concede à Oralzon uma licença não exclusiva e gratuita para os publicar, traduzir automaticamente para os idiomas da plataforma e utilizar na promoção do catálogo, limitada à duração da relação.",
        "Marcas, interfaces, textos editoriais e software da plataforma pertencem à entidade que a explora e não podem ser reproduzidos sem autorização.",
        "Removemos os conteúdos que se revelem ilícitos, enganosos ou contrários a estas Condições, informando o autor com indicação dos motivos."
      ],
    },
    {
      heading: "10. Responsabilidade",
      paragraphs: [
        "A Oralzon responde pelo funcionamento da plataforma tecnológica e pela exatidão da informação que ela própria disponibiliza. Não é parte no contrato de compra e venda e não responde pela qualidade, conformidade ou segurança dos produtos, pelo comportamento dos vendedores ou pelos prazos de entrega, que ficam exclusivamente a cargo do vendedor.",
        "Salvo dolo ou culpa grave, e salvo danos pessoais, a responsabilidade global da Oralzon perante um vendedor é limitada ao que este pagou à plataforma nos doze meses anteriores ao facto. Perante um comprador é limitada ao montante da encomenda a que a contestação se refere.",
        "Nenhuma cláusula destas Condições exclui ou limita responsabilidades que a lei aplicável não permita excluir ou limitar."
      ],
    },
    {
      heading: "11. Lei aplicável e foro competente",
      paragraphs: [
        "Estas Condições regem-se pela lei italiana.",
        "Para qualquer litígio é exclusivamente competente o Tribunal de Cassino (Itália). Tratando-se de relações entre profissionais, as partes reconhecem que tal atribuição é convencionada por escrito nos termos do art. 25.º do Regulamento (UE) 1215/2012.",
        "A versão italiana destas Condições prevalece em caso de divergência com as traduções."
      ],
    },
  ],
};

const CONDIZIONI_VENDITA_PT: LegalDocument = {
  title: "Condições de Venda",
  lastUpdated: "Agosto de 2026",
  sections: [
    {
      heading: "1. Âmbito de aplicação",
      paragraphs: [
        "Estas Condições regulam as compras efetuadas através da Oralzon por operadores profissionais do setor dentário. Os produtos são vendidos pelos fornecedores inscritos (vendedores): o contrato é celebrado entre vendedor e comprador, enquanto a Oralzon intervém como intermediário tecnológico e encarregado da cobrança.",
        "Uma vez que o comprador atua sempre no exercício da sua atividade, **não são aplicáveis as proteções do Código do Consumo italiano** (D.Lgs. 206/2005), reservadas aos consumidores."
      ],
    },
    {
      heading: "2. Encomendas e confirmação",
      paragraphs: [
        "A encomenda perfeciona-se quando o pagamento é confirmado. O comprador recebe de imediato um correio eletrónico com o número da encomenda e o resumo, que vale como aceitação da proposta do vendedor.",
        "Os pagamentos iniciados e não concluídos não dão origem a qualquer encomenda e são anulados automaticamente decorridas 24 horas.",
        "A disponibilidade dos produtos é verificada no momento da encomenda. Se, por compras concomitantes, um artigo ficar indisponível após a confirmação, o vendedor comunica-o e procede-se ao reembolso da parte não satisfeita."
      ],
    },
    {
      heading: "3. Preços, IVA e pagamento",
      bullets: [
        "Os preços são em euros. Nas vendas nacionais incluem o IVA à taxa em vigor no país do vendedor",
        "Nas vendas entre um vendedor e um comprador estabelecidos em dois Estados-Membros diferentes da União Europeia, ambos com número de IVA validado no sistema VIES, aplica-se a autoliquidação: a contrapartida não inclui IVA e o comprador liquida o imposto no seu próprio país, conforme indicado na fatura",
        "Se a verificação no VIES não for positiva para uma das duas partes, aplica-se o IVA do país do vendedor",
        "O pagamento é efetuado por cartão de crédito ou débito e é processado pela Stripe. A Oralzon não trata nem conserva os dados dos cartões",
        "O montante é devido integralmente no momento da encomenda",
        "A fatura é emitida pelo vendedor, único sujeito obrigado: a Oralzon fornece os dados necessários mas não emite fatura por conta dele"
      ],
    },
    {
      heading: "4. Comissão e plano de vendedor",
      paragraphs: [
        "Sobre cada venda concluída a Oralzon retém uma comissão de **7 % sobre o valor da mercadoria** (base tributável, IVA excluído), deduzida do montante creditado ao vendedor. A comissão cobre os custos de processamento dos pagamentos e os serviços da plataforma.",
        "**A comissão não se aplica às despesas de envio**, que não constituem receita da plataforma.",
        "O acesso à plataforma exige ainda um plano de vendedor anual, nas condições indicadas na página dedicada no momento da subscrição. Terminado o período experimental gratuito, a ausência de subscrição implica a suspensão das vendas, precedida de avisos por correio eletrónico antes do termo e nos dias seguintes. Catálogo, encomendas e estatísticas permanecem arquivados e voltam a estar disponíveis com a ativação do plano.",
        "Eventuais alterações à percentagem de comissão são comunicadas por correio eletrónico com pré-aviso mínimo de 30 dias e não se aplicam às encomendas já recebidas."
      ],
    },
    {
      heading: "5. Expedições",
      paragraphs: [
        "Cada vendedor expede autonomamente os seus produtos. Nas encomendas que envolvem vários fornecedores os produtos viajam separadamente, com despesas e rastreio distintos para cada vendedor.",
        "As despesas de envio são determinadas pelo vendedor por zona de destino e mostradas ao comprador antes do pagamento, discriminadas por fornecedor. O vendedor pode estabelecer um limiar de encomenda acima do qual o envio é gratuito: nesse caso o custo do transporte fica a seu cargo.",
        "Os prazos de entrega indicados nas fichas de produto são estimados e não vinculativos. A Oralzon expede exclusivamente dentro da União Europeia.",
        "O comprador recebe por correio eletrónico o número de rastreio no momento da expedição e é convidado a confirmar a receção na secção de encomendas. Na ausência de confirmação, a entrega considera-se efetuada decorridos 7 dias da expedição nos envios nacionais e 15 dias nos intracomunitários."
      ],
    },
    {
      heading: "6. Pagamento ao vendedor",
      paragraphs: [
        "Os montantes cobrados permanecem na Oralzon até à confirmação da entrega, manual ou automática nos termos do ponto 5. Só então o líquido é creditado ao vendedor na conta associada.",
        "Esta modalidade protege ambas as partes: permite tratar uma devolução ou uma reclamação antes de os montantes serem transferidos, e assegura ao vendedor um crédito automático sem necessidade de insistência.",
        "Um pedido de devolução em aberto suspende o crédito relativo ao artigo em causa até à conclusão do processo.",
        "Para receber os créditos o vendedor deve concluir a verificação de identidade exigida pelo prestador de serviços de pagamento. Até lá os montantes ficam retidos e não se perdem."
      ],
    },
    {
      heading: "7. Devoluções e reembolsos",
      paragraphs: [
        "Tratando-se de vendas entre profissionais, **não existe um direito de livre resolução previsto na lei**. A Oralzon reconhece, contudo, como política comercial própria, a possibilidade de pedir uma devolução no prazo de **30 dias** a contar da entrega, nas condições que se seguem.",
        "O pedido abre-se na secção «As minhas encomendas» e pode abranger apenas parte das quantidades compradas. O vendedor analisa-o e pode deferi-lo ou indeferi-lo fundamentando a decisão.",
        "Os produtos devem ser devolvidos íntegros, na embalagem original por abrir e completos de todos os elementos. **Estão excluídos da devolução** os dispositivos de uso único com embalagem estéril aberta ou danificada, os produtos feitos por medida, os sujeitos a rápida deterioração e aqueles cuja segurança deixa de ser verificável depois de abertos.",
        "Salvo acordo em contrário, as despesas de devolução ficam a cargo do comprador. Ficam, pelo contrário, a cargo do vendedor quando o produto seja defeituoso, não conforme com a encomenda ou danificado durante o transporte.",
        "O reembolso é calculado sobre o preço efetivamente pago pelos artigos devolvidos e é efetuado no mesmo meio de pagamento no prazo de 14 dias a contar da aceitação da devolução. O vendedor pode reter uma parte fundamentada por uma desvalorização não decorrente da verificação do produto.",
        "Esta política não prejudica os direitos de garantia por defeitos da coisa vendida previstos no Código Civil italiano, que ficam ressalvados."
      ],
    },
    {
      heading: "8. Garantia e conformidade dos produtos",
      paragraphs: [
        "O vendedor garante, sob sua exclusiva responsabilidade, que os produtos publicados são conformes com a legislação aplicável, incluindo o Regulamento (UE) 2017/745 sobre dispositivos médicos, e que dispõe dos títulos necessários para os comercializar.",
        "A Oralzon verifica os dados identificativos e fiscais fornecidos no registo, mas não examina nem certifica a conformidade de cada produto, que fica inteiramente a cargo do vendedor.",
        "À venda aplica-se a garantia legal por defeitos prevista nos arts. 1490.º e seguintes do Código Civil italiano, nas relações entre vendedor e comprador."
      ],
    },
    {
      heading: "9. Avaliações e perguntas",
      paragraphs: [
        "Só podem deixar uma avaliação os compradores que tenham efetivamente adquirido o produto: a verificação é automática e não pode ser contornada.",
        "As avaliações e as perguntas são públicas e indicam o nome do autor. Não é permitido inserir nelas contactos diretos nem conteúdos difamatórios, ilícitos ou alheios ao produto.",
        "Não removemos avaliações negativas a pedido do vendedor, que pode contudo responder publicamente. Removemos os conteúdos que violem estas regras, informando o autor."
      ],
    },
    {
      heading: "10. Lei aplicável e foro competente",
      paragraphs: [
        "Estas Condições regem-se pela lei italiana. Para qualquer litígio é exclusivamente competente o Tribunal de Cassino (Itália), nos termos do art. 25.º do Regulamento (UE) 1215/2012, tratando-se de relações entre profissionais.",
        "A versão italiana prevalece em caso de divergência com as traduções."
      ],
    },
    {
      heading: "11. Contactos",
      paragraphs: [
        "Para qualquer informação sobre estas Condições: **support@oralzon.com**"
      ],
    },
  ],
};

export const PT_LEGAL: { termini: LegalDocument; condizioni: LegalDocument } = {
  termini: TERMINI_SERVIZIO_PT,
  condizioni: CONDIZIONI_VENDITA_PT,
};
