import type { LegalDocument } from '../legalContent';

/**
 * Versión española de los textos legales.
 *
 * Dos decisiones de traducción deliberadas:
 *
 * 1. Los datos del operador figuran por ahora solo como "Oralzon", sin
 *    denominación social, domicilio ni NIF-IVA. Es una decisión
 *    provisional deliberada: los datos existen y deben incorporarse.
 *    Véase docs/dati-societari-mancanti.md.
 *
 * 2. Las remisiones al Derecho italiano (Código de Consumo, Código Civil,
 *    Tribunal de Cassino) NO se sustituyen por sus equivalentes españoles:
 *    se identifican expresamente como Derecho italiano. El contrato se rige
 *    por la ley italiana (punto 11); trasladarlas al ordenamiento español
 *    sería materialmente falso y generaría expectativas equivocadas.
 */

const TERMINI_SERVIZIO_ES: LegalDocument = {
  title: "Condiciones del Servicio",
  lastUpdated: "Agosto de 2026",
  sections: [
    {
      heading: "1. Quiénes somos y qué regulan estas condiciones",
      paragraphs: [
        "Oralzon es un servicio de intermediación en línea que pone en contacto a proveedores de productos odontológicos (**vendedores**) con operadores profesionales del sector (**compradores**). Oralzon no vende productos propios a los compradores a través del servicio de intermediación: cada contrato de compraventa se celebra directamente entre el vendedor y el comprador.",
        "El operador de la plataforma es **Oralzon**, contactable en support@oralzon.com.",
        "Al utilizar la plataforma aceptas estas Condiciones. Si no las aceptas, no puedes utilizarla. Las Condiciones de Venta, la Política de Privacidad y la Política de Cookies forman parte integrante de las mismas."
      ],
    },
    {
      heading: "2. Quién puede usar Oralzon",
      paragraphs: [
        "Oralzon está reservada a sujetos que actúan en el ejercicio de su actividad profesional o empresarial y son titulares de un NIF-IVA válido. No se dirige a consumidores: en consecuencia, **no resultan de aplicación las protecciones del Código de Consumo italiano** (D.Lgs. 206/2005), que se refieren exclusivamente a las personas físicas que actúan con fines ajenos a su actividad.",
        "Los vendedores deben estar establecidos en uno de los 27 Estados miembros de la Unión Europea. Este requisito deriva de las reglas de IVA sobre el proveedor presunto (art. 14 bis de la Directiva 2006/112/CE) y no admite excepción.",
        "Eres responsable de la veracidad de los datos facilitados, de la custodia de tus credenciales y de cuanto ocurra a través de tu cuenta."
      ],
    },
    {
      heading: "3. Modificaciones de estas condiciones",
      paragraphs: [
        "Podemos modificar estas Condiciones. Las modificaciones se comunican a los vendedores por correo electrónico y se publican en la plataforma **al menos 15 días antes** de surtir efecto, conforme al art. 3 del Reglamento (UE) 2019/1150. Si la modificación exige adaptaciones técnicas o comerciales significativas, el preaviso será proporcionalmente más largo.",
        "Durante el plazo de preaviso el vendedor puede resolver sin coste. La publicación de nuevos productos o la falta de baja dentro del plazo equivalen a aceptación.",
        "El preaviso no se aplica cuando la modificación viene impuesta por una obligación legal o sirve para hacer frente a un peligro inminente para la seguridad de la plataforma o de sus usuarios."
      ],
    },
    {
      heading: "4. Cómo se ordenan los productos (posicionamiento)",
      paragraphs: [
        "En aplicación del art. 5 del Reglamento (UE) 2019/1150 indicamos los parámetros principales que determinan la posición de los productos en los resultados de búsqueda y en las secciones de la plataforma, así como su importancia relativa.",
        "Los resultados de búsqueda se ordenan combinando la **correspondencia con el término buscado** y algunos parámetros relativos al producto. La correspondencia sigue siendo el factor dominante: los demás parámetros determinan el orden **entre productos igualmente relevantes**, no para anteponer un producto menos relevante a uno más relevante."
      ],
      bullets: [
        "**Correspondencia con la búsqueda** — es el parámetro prevalente y ningún otro puede revertirlo. La búsqueda compara el término introducido con el nombre del producto (también traducido), la marca, el código de artículo y la descripción, con peso decreciente en ese orden: una coincidencia en el nombre vale más que la misma palabra presente solo en la descripción",
        "**Filtros y ordenación elegidos por el comprador** — cuando el comprador ordena por precio, esa elección prevalece sobre cualquier otro parámetro, incluidas las posiciones de pago",
        "**Disponibilidad** — a igual correspondencia, un producto disponible precede a uno agotado. Es el segundo parámetro por importancia, porque un resultado que no se puede comprar no es útil ni al comprador ni al vendedor. Los productos agotados permanecen visibles y no se eliminan de los resultados",
        "**Ventas realizadas** — a igual correspondencia, un producto ya adquirido por otros profesionales precede a uno sin historial de ventas. El efecto es progresivo pero decreciente: la diferencia entre ninguna venta y las primeras cuenta mucho más que la que hay entre muchas y muchísimas, de modo que un producto consolidado no ocupa la posición de forma permanente",
        "**Reseñas recibidas** — media de las valoraciones, ponderada por su número: pocas reseñas excelentes pesan menos que muchas reseñas buenas. Solo se admiten reseñas de compradores que hayan adquirido efectivamente ese producto en la plataforma",
        "**Productos publicados recientemente** — los productos publicados hace poco reciben una ventaja explícita en el posicionamiento, que se reduce gradualmente durante los tres primeros meses. Es una decisión deliberada: sin ella un marketplace favorecería de forma estable a quien ya vende, y un vendedor que entra hoy no tendría manera de empezar",
        "**Posicionamiento de pago** — los vendedores pueden adquirir paquetes de visibilidad (productos destacados, espacios en la página de inicio, espacios por categoría, tarjetas contextuales). Estos contenidos están **siempre señalados como «Patrocinado»**. En los resultados de búsqueda el patrocinio **se suma** a la puntuación del producto y no la multiplica: puede por tanto prevalecer a igual correspondencia, pero **no puede situar un producto poco relevante por encima de uno muy relevante**. Cuando un espacio de pago está disponible pero ningún vendedor lo ha adquirido, mostramos un producto no patrocinado con la etiqueta neutra «Destacado», sin atribuirle un patrocinio inexistente",
        "**Historial de compra y navegación del comprador** — utilizado para sugerir productos relevantes, con datos recogidos únicamente en esta plataforma. No afecta a precios ni condiciones y nunca prevalece sobre las decisiones explícitas del comprador ni sobre los espacios de pago",
        "**Ninguna preferencia por vendedor** — la antigüedad, el volumen global de ventas del vendedor, el plan suscrito y la posible adquisición de otros servicios no influyen en modo alguno en el posicionamiento de sus productos. Oralzon no vende productos propios y no tiene por tanto posiciones que favorecer"
      ],
    },
    {
      heading: "5. Obligaciones de los vendedores",
      bullets: [
        "Ser sujetos jurídicos regularmente constituidos, con NIF-IVA válido en un Estado miembro de la Unión Europea",
        "Publicar información de producto completa, exacta y no engañosa, incluidas las menciones obligatorias por ley",
        "Garantizar que los productos clasificados como productos sanitarios cumplen el Reglamento (UE) 2017/745 (MDR) y cualquier otra normativa aplicable",
        "Mantener actualizadas las existencias y servir los pedidos recibidos en los plazos declarados",
        "Gestionar el envío de sus propios productos e introducir los datos de seguimiento",
        "Utilizar los datos de los compradores exclusivamente para servir el pedido, respetando el RGPD",
        "**No dirigir a los compradores fuera de la plataforma**: está prohibido insertar datos de contacto directos (correo electrónico, teléfono, mensajería, sitios de terceros) en las fichas de producto, en las respuestas a preguntas, en las reseñas, en las imágenes o en los materiales incluidos en los envíos, con el fin de cerrar fuera de Oralzon ventas originadas en la plataforma",
        "Cumplir por sí mismo todas las obligaciones fiscales, incluidos los estados recapitulativos de las entregas intracomunitarias (Intrastat) cuando procedan: Oralzon no los presenta por cuenta del vendedor"
      ],
    },
    {
      heading: "6. Limitación, suspensión y cese del servicio",
      paragraphs: [
        "En aplicación del art. 4 del Reglamento (UE) 2019/1150, cuando limitamos o suspendemos los servicios a un vendedor le comunicamos **los motivos concretos** de la decisión, en soporte duradero, a más tardar en el momento en que la medida surte efecto.",
        "Si decidimos cesar por completo la prestación de los servicios, el preaviso es de **al menos 30 días**, salvo que concurra una obligación legal, un incumplimiento grave y reiterado de estas Condiciones, o un riesgo concreto para la seguridad de los usuarios o la integridad del servicio.",
        "El vendedor puede impugnar la decisión mediante el procedimiento de reclamación del punto 7. Si la impugnación prospera, la medida se revoca sin demora indebida.",
        "El vencimiento del período de prueba o del plan de vendedor, cuando no se renueva, no es una sanción: se rige por las Condiciones de Venta y va precedido de los correspondientes avisos.",
        "**Los pedidos ya recibidos antes de una suspensión siguen siendo válidos** y deben servirse. Los importes correspondientes se abonan en las condiciones ordinarias."
      ],
    },
    {
      heading: "7. Reclamaciones y resolución de controversias",
      paragraphs: [
        "Todo vendedor puede presentar una reclamación escribiendo a **support@oralzon.com**, indicando el objeto de la impugnación. Tramitamos las reclamaciones en plazos razonables y proporcionados a su complejidad, y comunicamos el resultado de forma individual y en lenguaje claro.",
        "El operador de la plataforma es actualmente una pequeña empresa a efectos del art. 11, apartado 5, del Reglamento (UE) 2019/1150 y no está obligado, por tanto, a establecer un sistema interno formalizado de gestión de reclamaciones. Mantenemos, en todo caso, el procedimiento descrito.",
        "A falta de acuerdo, las partes pueden acudir por vía extrajudicial a un organismo de mediación inscrito en el registro del Ministerio de Justicia italiano y competente en materia mercantil. El recurso a la mediación no perjudica el derecho de acudir a la autoridad judicial.",
        "Quedan a salvo los derechos reconocidos a las organizaciones representativas de los vendedores por el art. 14 del mismo Reglamento."
      ],
    },
    {
      heading: "8. Acceso a los datos",
      paragraphs: [
        "El vendedor tiene acceso, desde su área privada, a los datos generados por su actividad: pedidos recibidos, productos vendidos, facturación, reseñas, preguntas de los clientes, transferencias y resúmenes fiscales.",
        "No compartimos con los vendedores el correo electrónico ni el teléfono de los compradores. Sí reciben nombre, dirección de envío y datos de facturación, necesarios para entregar y emitir factura. Esta decisión protege a los compradores de comunicaciones no solicitadas y mantiene trazables los intercambios en caso de controversia.",
        "No cedemos a terceros los datos agregados generados en la plataforma para las finalidades comerciales propias de estos."
      ],
    },
    {
      heading: "9. Propiedad intelectual y contenidos",
      paragraphs: [
        "El vendedor conserva todos los derechos sobre los contenidos que publica y garantiza ser titular de los mismos. Concede a Oralzon una licencia no exclusiva y gratuita para publicarlos, traducirlos automáticamente a los idiomas de la plataforma y utilizarlos para promocionar el catálogo, limitada a la duración de la relación.",
        "Las marcas, interfaces, textos editoriales y software de la plataforma pertenecen al operador y no pueden reproducirse sin autorización.",
        "Retiramos los contenidos que resulten ilícitos, engañosos o contrarios a estas Condiciones, informando a su autor con indicación de los motivos."
      ],
    },
    {
      heading: "10. Responsabilidad",
      paragraphs: [
        "Oralzon responde del funcionamiento de la plataforma tecnológica y de la exactitud de la información que ella misma facilita. No es parte del contrato de compraventa y no responde de la calidad, conformidad o seguridad de los productos, del comportamiento de los vendedores ni de los plazos de entrega, que corresponden exclusivamente al vendedor.",
        "Salvo dolo o culpa grave, y salvo los daños personales, la responsabilidad global de Oralzon frente a un vendedor se limita a lo abonado por este a la plataforma en los doce meses anteriores al hecho. Frente a un comprador se limita al importe del pedido al que se refiera la reclamación.",
        "Ninguna cláusula de estas Condiciones excluye ni limita responsabilidades que la ley aplicable no permita excluir o limitar."
      ],
    },
    {
      heading: "11. Ley aplicable y fuero competente",
      paragraphs: [
        "Estas Condiciones se rigen por la ley italiana.",
        "Para cualquier controversia será competente en exclusiva el Tribunal de Cassino (Italia). Al tratarse de relaciones entre profesionales, las partes reconocen que dicha atribución se conviene por escrito a efectos del art. 25 del Reglamento (UE) 1215/2012.",
        "La versión italiana de estas Condiciones prevalece en caso de discrepancia con las traducciones."
      ],
    },
  ],
};

const CONDIZIONI_VENDITA_ES: LegalDocument = {
  title: "Condiciones de Venta",
  lastUpdated: "Agosto de 2026",
  sections: [
    {
      heading: "1. Ámbito de aplicación",
      paragraphs: [
        "Estas Condiciones regulan las compras realizadas a través de Oralzon por operadores profesionales del sector odontológico. Los productos son vendidos por los proveedores registrados (vendedores): el contrato se celebra entre vendedor y comprador, mientras que Oralzon interviene como intermediario tecnológico y encargado del cobro.",
        "Dado que el comprador actúa siempre en el ejercicio de su actividad, **no resultan de aplicación las protecciones del Código de Consumo italiano** (D.Lgs. 206/2005), reservadas a los consumidores."
      ],
    },
    {
      heading: "2. Pedidos y confirmación",
      paragraphs: [
        "El pedido se perfecciona cuando se confirma el pago. El comprador recibe de inmediato un correo con el número de pedido y el resumen, que equivale a la aceptación de la oferta del vendedor.",
        "Los procesos de pago iniciados y no completados no dan lugar a pedido alguno y se anulan automáticamente transcurridas 24 horas.",
        "La disponibilidad de los productos se comprueba en el momento del pedido. Si, por compras concurrentes, un artículo resultara no disponible tras la confirmación, el vendedor lo comunica y se procede al reembolso de la parte no servible."
      ],
    },
    {
      heading: "3. Precios, IVA y pago",
      bullets: [
        "Los precios se expresan en euros. En las ventas nacionales incluyen el IVA al tipo vigente en el país del vendedor",
        "En las ventas entre un vendedor y un comprador establecidos en dos Estados miembros distintos de la Unión Europea, ambos con NIF-IVA validado en el sistema VIES, se aplica la inversión del sujeto pasivo: la contraprestación no incluye el IVA y el comprador autoliquida el impuesto en su propio país, según se indica en la factura",
        "Si la verificación en VIES no resulta positiva para alguna de las dos partes, se aplica el IVA del país del vendedor",
        "El pago se efectúa mediante tarjeta de crédito o débito y lo procesa Stripe. Oralzon no trata ni conserva los datos de las tarjetas",
        "El importe es exigible íntegramente en el momento del pedido",
        "La factura la emite el vendedor, único sujeto obligado: Oralzon facilita los datos necesarios pero no emite factura por su cuenta"
      ],
    },
    {
      heading: "4. Comisión y plan de vendedor",
      paragraphs: [
        "Sobre cada venta cerrada Oralzon retiene una comisión del **7 % sobre el valor de la mercancía** (base imponible, IVA excluido), descontada del importe abonado al vendedor. La comisión cubre los costes de procesamiento de los pagos y los servicios de la plataforma.",
        "**La comisión no se aplica a los gastos de envío**, que no constituyen ingreso de la plataforma.",
        "El acceso a la plataforma requiere además un plan de vendedor anual, en las condiciones indicadas en la página correspondiente al suscribirlo. Finalizado el período de prueba gratuito, la ausencia de suscripción conlleva la suspensión de las ventas, precedida de avisos por correo electrónico antes del vencimiento y en los días siguientes. Catálogo, pedidos y estadísticas permanecen archivados y vuelven a estar disponibles al activar el plan.",
        "Cualquier modificación del porcentaje de comisión se comunica por correo electrónico con un preaviso mínimo de 30 días y no se aplica a los pedidos ya recibidos."
      ],
    },
    {
      heading: "5. Envíos",
      paragraphs: [
        "Cada vendedor envía por su cuenta sus productos. En los pedidos que implican a varios proveedores los productos viajan por separado, con gastos y seguimiento distintos para cada vendedor.",
        "Los gastos de envío los determina el vendedor por zona de destino y se muestran al comprador antes del pago, desglosados por proveedor. El vendedor puede fijar un umbral de pedido por encima del cual el envío es gratuito: en tal caso el coste del transporte corre de su cuenta.",
        "Los plazos de entrega indicados en las fichas de producto son estimados y no vinculantes. Oralzon envía exclusivamente dentro de la Unión Europea.",
        "El comprador recibe por correo electrónico el número de seguimiento en el momento del envío y se le invita a confirmar la recepción desde la sección de pedidos. A falta de confirmación, la entrega se entiende realizada transcurridos 7 días desde el envío en los envíos nacionales y 15 días en los intracomunitarios."
      ],
    },
    {
      heading: "6. Pago al vendedor",
      paragraphs: [
        "Los importes cobrados permanecen en Oralzon hasta la confirmación de entrega, manual o automática según los términos del punto 5. Solo entonces se abona el neto al vendedor en la cuenta vinculada.",
        "Esta modalidad protege a ambas partes: permite gestionar una devolución o una reclamación antes de que las sumas se transfieran, y asegura al vendedor un abono automático sin necesidad de reclamación.",
        "Una solicitud de devolución abierta suspende el abono correspondiente al artículo afectado hasta la resolución del expediente.",
        "Para recibir los abonos el vendedor debe completar la verificación de identidad exigida por el proveedor de servicios de pago. Hasta entonces las sumas quedan retenidas y no se pierden."
      ],
    },
    {
      heading: "7. Devoluciones y reembolsos",
      paragraphs: [
        "Al tratarse de ventas entre profesionales, **no existe un derecho de desistimiento previsto por la ley**. Oralzon reconoce, no obstante, como política comercial propia, la posibilidad de solicitar una devolución en el plazo de **30 días** desde la entrega, en las condiciones que siguen.",
        "La solicitud se abre desde la sección «Mis pedidos» y puede referirse incluso a una parte de las cantidades compradas. El vendedor la examina y puede aceptarla o rechazarla motivando la decisión.",
        "Los productos deben devolverse íntegros, en su envase original sin abrir y completos de todos sus elementos. **Quedan excluidos de la devolución** los dispositivos de un solo uso con envase estéril abierto o dañado, los productos hechos a medida, los sujetos a rápido deterioro y aquellos cuya seguridad ya no es verificable una vez abiertos.",
        "Salvo acuerdo distinto, los gastos de devolución corren a cargo del comprador. Corresponden en cambio al vendedor cuando el producto es defectuoso, no conforme con el pedido o dañado durante el transporte.",
        "El reembolso se calcula sobre el precio efectivamente pagado por los artículos devueltos y se realiza en el mismo medio de pago dentro de los 14 días siguientes a la aceptación de la devolución. El vendedor puede retener una parte motivada por un deterioro no debido a la verificación del producto.",
        "Esta política no perjudica los derechos de garantía por vicios de la cosa vendida previstos en el Código Civil italiano, que quedan a salvo."
      ],
    },
    {
      heading: "8. Garantía y conformidad de los productos",
      paragraphs: [
        "El vendedor garantiza, bajo su exclusiva responsabilidad, que los productos publicados son conformes con la normativa aplicable, incluido el Reglamento (UE) 2017/745 sobre productos sanitarios, y que dispone de los títulos necesarios para comercializarlos.",
        "Oralzon verifica los datos identificativos y fiscales facilitados en el registro, pero no examina ni certifica la conformidad de cada producto, que queda enteramente a cargo del vendedor.",
        "A la venta se aplica la garantía legal por vicios prevista en los arts. 1490 y siguientes del Código Civil italiano, en las relaciones entre vendedor y comprador."
      ],
    },
    {
      heading: "9. Reseñas y preguntas",
      paragraphs: [
        "Solo pueden dejar una reseña los compradores que hayan adquirido efectivamente el producto: la verificación es automática y no puede eludirse.",
        "Las reseñas y las preguntas son públicas e incluyen el nombre del autor. No está permitido insertar en ellas datos de contacto directos ni contenidos difamatorios, ilícitos o ajenos al producto.",
        "No retiramos reseñas negativas a petición del vendedor, quien sí puede responder públicamente. Retiramos los contenidos que infringen estas reglas, informando a su autor."
      ],
    },
    {
      heading: "10. Ley aplicable y fuero competente",
      paragraphs: [
        "Estas Condiciones se rigen por la ley italiana. Para cualquier controversia será competente en exclusiva el Tribunal de Cassino (Italia), conforme al art. 25 del Reglamento (UE) 1215/2012, al tratarse de relaciones entre profesionales.",
        "La versión italiana prevalece en caso de discrepancia con las traducciones."
      ],
    },
    {
      heading: "11. Contacto",
      paragraphs: [
        "Para cualquier información sobre estas Condiciones: **support@oralzon.com**"
      ],
    },
  ],
};

export const ES_LEGAL: { termini: LegalDocument; condizioni: LegalDocument } = {
  termini: TERMINI_SERVIZIO_ES,
  condizioni: CONDIZIONI_VENDITA_ES,
};
