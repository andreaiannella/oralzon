import type { AcademyGuideSection } from '../academyGuides';
import type { AcademyGuideTranslation } from './en';

export const ES_ACADEMY_TRANSLATIONS: Record<string, AcademyGuideTranslation> = {
  "come-iniziare-su-oralzon": {
    title: "Cómo empezar en Oralzon",
    description: "El recorrido esencial de los primeros días: qué completar antes de abrir de verdad al público, y en qué orden.",
    sections: [
      {
        heading: "El perfil de la tienda, lo primero",
        paragraphs: [
          "Antes de subir productos, conviene completar el perfil en Ajustes: nombre de la tienda, teléfono, sitio web (si tienes uno), y los datos fiscales (NIF/CIF, PEC o código SDI) necesarios para la facturación. No hay logotipo ni descripción que subir — en Oralzon la identidad del vendedor es el nombre de la tienda más el eventual distintivo de vendedor verificado, no una imagen."
        ],
      },
      {
        heading: "Conectar Stripe antes de publicar productos",
        paragraphs: [
          "La cuenta de Stripe conectada es la que realmente recibe los pagos de las ventas — sin ella, un producto puede publicarse e incluso comprarse, pero los fondos quedan pendientes en Oralzon hasta que se complete la conexión. La página de Pagos muestra siempre el estado actualizado de la conexión, y un banner en la parte superior del panel lo recuerda mientras no esté activa."
        ],
      },
      {
        heading: "Los primeros productos: calidad antes que cantidad",
        paragraphs: [
          "Mejor 10-15 productos con fichas completas (varias fotos, descripción detallada, categoría correcta) que 50 fichas mínimas. Las fichas incompletas se posicionan peor en la búsqueda interna y convierten menos — un cliente que busca una herramienta específica y encuentra una descripción vaga casi siempre pasa al siguiente resultado.",
          "La importación desde Excel (sección Import Excel) es útil cuando se parte de un catálogo que ya existe en una hoja de cálculo, pero de todos modos conviene revisar a mano las primeras fichas importadas antes de publicarlas: la calidad de las fotos en particular no se puede automatizar."
        ],
      },
      {
        heading: "Qué ocurre en los primeros 6 meses",
        paragraphs: [
          "El periodo de prueba gratuito dura 180 días desde el registro — durante este periodo no se paga la cuota del plan de vendedor, pero la comisión sobre las ventas sigue activa desde el primer pedido. Conviene aprovechar estos meses para probar qué funciona (categorías, precios, patrocinios) antes de que empiece la cuota."
        ],
      },
    ],
  },
  "migliorare-le-vendite": {
    title: "Mejorar las ventas: qué mueve de verdad los números",
    description: "Las palancas que tienen un impacto real en las ventas, en orden de prioridad práctica — no todo vale el mismo esfuerzo.",
    sections: [
      {
        heading: "Las fotos importan más que la descripción",
        paragraphs: [
          "En un marketplace B2B la tentación es escribir descripciones técnicas larguísimas y descuidar las fotos, dando por hecho que quien compra ya sabe lo que busca. En la práctica ocurre lo contrario: las fotos son el primer filtro con el que un comprador descarta o considera un producto, la descripción entra en juego después. Fotos nítidas, sobre fondo neutro, que muestren el producto desde varios ángulos, marcan una diferencia medible en la tasa de conversión."
        ],
      },
      {
        heading: "El precio no es la única palanca competitiva",
        paragraphs: [
          "En un marketplace con varios vendedores para la misma categoría de producto, la tentación es competir solo por el precio más bajo — pero unos plazos de envío indicados honestamente, una ficha de producto completa y las reseñas positivas acumuladas con el tiempo pesan tanto o más que el precio para un comprador profesional que evalúa la fiabilidad del proveedor, no solo el coste del pedido."
        ],
      },
      {
        heading: "Responder a las reseñas, también a las negativas",
        paragraphs: [
          "Desde la sección Reseñas puedes responder públicamente a cada reseña — tu respuesta queda visible debajo de la del cliente. Una reseña negativa sin respuesta pesa más que la propia reseña: comunica que el problema no se abordó. Una respuesta pública, aunque sea breve, que reconoce el problema y explica qué se hizo, recupera gran parte de la confianza perdida."
        ],
      },
      {
        heading: "Los patrocinios funcionan mejor en productos ya validados",
        paragraphs: [
          "Patrocinar un producto que todavía no ha vendido nada, para probar si funciona, casi siempre es menos eficiente que patrocinar un producto que ya vende bien de forma orgánica — el patrocinio amplifica la visibilidad, no compensa una ficha débil o un precio fuera de mercado. Conviene mirar las estadísticas antes de elegir qué patrocinar, no después."
        ],
      },
    ],
  },
  "fatturazione-e-dati-fiscali": {
    title: "Facturación: qué hace Oralzon y qué le corresponde al vendedor",
    description: "Cómo funciona de verdad el cálculo del IVA línea por línea, qué encuentras en el informe de ventas, y qué te queda por hacer a ti.",
    sections: [
      {
        heading: "Oralzon no emite facturas en tu lugar",
        paragraphs: [
          "Un punto importante que hay que tener claro desde el principio: Oralzon no se responsabiliza de la emisión de las facturas fiscales reales. Cada vendedor sigue siendo un sujeto fiscal independiente, y debe emitir sus propias facturas electrónicas (o a través de su gestor) para cada pedido. Lo que Oralzon proporciona, en la sección Informe de Ventas → Datos para facturación, es el cálculo ya preparado — base imponible, tipo, IVA, motivo de exención si lo hay — para que no tengas que rehacerlo a mano."
        ],
      },
      {
        heading: "Cómo se calcula el IVA en cada pedido",
        paragraphs: [
          "El cálculo sigue la regla estándar de la UE para las entregas de bienes B2B: venta nacional (mismo país de vendedor y cliente) aplica el IVA completo del país del vendedor; venta intracomunitaria con ambas partes verificadas en VIES aplica la inversión del sujeto pasivo (IVA a cero, el cliente se autoliquida el impuesto); venta intracomunitaria sin verificación VIES aplica igualmente el IVA completo, por prudencia; venta extra-UE está exenta como exportación.",
          "Este cálculo se realiza automáticamente para cada línea de pedido, en el momento de la compra — no hace falta configurar nada para que funcione."
        ],
      },
      {
        heading: "Exportar los datos para tu gestor",
        paragraphs: [
          "El botón Exportar CSV en la sección Datos para facturación genera un archivo con una línea por cada producto de cada pedido — el nivel de detalle que realmente hace falta para preparar una factura, no un agregado mensual. Es el archivo más cómodo para entregar a tu gestor o usar como base para emitir las facturas electrónicas."
        ],
      },
    ],
  },
  "marketing-su-oralzon": {
    title: "Marketing en Oralzon",
    description: "Cómo te encuentran los clientes, por qué al principio no lo hacen y qué puedes hacer para cambiarlo.",
    sections: [
      {
        heading: "El problema de quien empieza: existir no basta para ser encontrado",
        paragraphs: [
          "Un catálogo cargado no es un catálogo visible. En cualquier marketplace los productos que aparecen más arriba son los que ya han vendido, ya han recibido reseñas, ya han acumulado un historial. Es un mecanismo lógico para quien compra —muestra lo que ha funcionado a otros— pero crea un problema circular para quien llega ahora: no vendes porque no te ven, y no te ven porque aún no has vendido.",
          "Por eso un proveedor serio, con productos excelentes y precios correctos, puede pasar meses sin un pedido mientras competidores menos competitivos venden cada día. No es una cuestión de calidad: es una cuestión de posición. Quien busca \\\"curetas Gracey\\\" mira los primeros resultados y rara vez llega a la tercera pantalla.",
          "Las promociones sirven exactamente para esto: comprar la posición que aún no has ganado, durante el tiempo necesario para ganártela de verdad. Son un acelerador del inicio, no un impuesto permanente."
        ],
      },
      {
        heading: "Qué cambia concretamente cuando un producto está promocionado",
        paragraphs: [
          "Un producto promocionado no se muestra \\\"un poco más arriba\\\": entra en espacios donde los productos normales no aparecen en absoluto. La tarjeta Destacado Hero, por ejemplo, es una ficha única con tu producto solo, sin competidores al lado, que aparece en la portada, en el catálogo y en las páginas de producto —donde un cliente ya está mirando artículos como los tuyos.",
          "La diferencia respecto a un buen posicionamiento orgánico es que la promoción actúa de inmediato y de forma previsible: sabes dónde aparecerás y durante cuánto tiempo. El posicionamiento orgánico llega después, como consecuencia de las ventas que la promoción te ha permitido hacer.",
          "Y este es el punto que muchos vendedores no captan: las ventas generadas mientras estás promocionado no desaparecen cuando la promoción termina. Quedan como historial de pedidos y como reseñas, y son precisamente los ingredientes que te hacen subir en los resultados también después. Un mes de visibilidad pagada puede dejarte en una posición que habrías tardado mucho más en alcanzar por tu cuenta."
        ],
      },
      {
        heading: "Cuándo conviene de verdad y cuándo no",
        paragraphs: [
          "Promocionar tiene sentido cuando el producto ya está listo para convertir: ficha completa, fotos nítidas, precio acorde al mercado, disponibilidad real en almacén. Llevar tráfico a una ficha vacía o a un artículo agotado es la forma más rápida de malgastar el presupuesto: el cliente llega, no encuentra lo que busca y no vuelve.",
          "Tiene sentido sobre todo en tres momentos: cuando abres la tienda y nadie te conoce todavía; cuando lanzas un producto nuevo sin historial; cuando quieres defender una categoría en la que un competidor está ganando terreno.",
          "Tiene menos sentido en productos que ya venden bien solos —ahí pagas por una visibilidad que habrías tenido igualmente— y en artículos con margen demasiado bajo, donde el coste de la promoción se come la ganancia. Antes de comprar, haz una cuenta sencilla: ¿cuántas unidades adicionales debes vender para amortizar el paquete? Si el número te parece razonable, adelante; si te parece alto, elige un producto con mejor margen.",
          "Las promociones no garantizan ventas: compran visibilidad, que es una condición necesaria pero no suficiente. Lo que ocurre después del clic depende de tu ficha de producto, de tu precio y de tu fiabilidad."
        ],
      },
      {
        heading: "Mide los resultados, no te fíes de la impresión",
        paragraphs: [
          "Antes de activar una promoción, anota tu punto de partida: cuántos pedidos y cuánta facturación ha generado ese producto en el último mes. Los encuentras en la sección Estadísticas del panel. Al vencer el paquete, compara las mismas cifras: solo así sabes si ha funcionado de verdad, en lugar de guiarte por sensaciones.",
          "Si un paquete ha rendido, renuévalo. Si no ha rendido, prueba a cambiar de producto o de tipo de visibilidad antes de concluir que las promociones no funcionan: a menudo el problema no es la herramienta sino la combinación entre herramienta y producto elegido."
        ],
      },
      {
        heading: "El nombre de la tienda y la insignia de verificado son tu identidad",
        paragraphs: [
          "En Oralzon no hay logotipo ni descripción de tienda que personalizar: lo que ve un cliente, en tu página de tienda y junto a tus productos, es el nombre de la empresa y, si la tienes, la insignia de vendedor verificado. Es una decisión deliberada de la plataforma: logotipo y descripción libre son los lugares donde más a menudo se intenta insertar contactos directos para sacar al cliente del marketplace, y eliminarlos protege a todos los vendedores por igual, evitando que quien respeta las reglas compita con quien no lo hace.",
          "Por eso vale la pena elegir un nombre de tienda claro y reconocible desde el registro: es el único elemento de identidad que te representa en toda la plataforma, incluidas las secciones promocionadas donde la competencia es más directa.",
          "La insignia de vendedor verificado no se compra: se obtiene completando la verificación de identidad en Stripe, la misma que sirve para recibir los pagos. Es la señal de fiabilidad más fuerte de la que dispones, y en las secciones promocionadas marca la diferencia: a igualdad de producto y precio, casi siempre se elige al vendedor verificado."
        ],
      },
      {
        heading: "Las reseñas son marketing, no solo opiniones",
        paragraphs: [
          "Las reseñas que los clientes dejan en tus productos son visibles para cualquiera que visite tu página de tienda o las fichas de producto: son, a todos los efectos, material generado por tus propios clientes, a menudo más convincente que cualquier descripción que puedas escribir. Después de un envío que ha ido bien, vale la pena pedir amablemente al cliente que deje una reseña en lugar de esperar a que ocurra solo.",
          "Las reseñas cuentan doble si estás promocionando: la visibilidad lleva al cliente a la ficha, pero es la prueba social la que le hace pulsar \\\"añadir al carrito\\\". Promocionar un producto sin reseñas funciona; promocionar uno con reseñas positivas funciona mucho mejor, con el mismo gasto."
        ],
      },
      {
        heading: "La página de tienda reúne todo tu catálogo",
        paragraphs: [
          "Muchos visitantes llegan a un producto mediante la búsqueda, pero luego pulsan el nombre del vendedor para ver el resto del catálogo: la página de tienda es a menudo el punto en el que se decide si un cliente se vuelve habitual o se queda en una compra única. Un catálogo organizado por categorías, con fichas completas, ayuda a retener a ese visitante.",
          "Es también el motivo por el que conviene promocionar el producto adecuado y no necesariamente el más barato: la promoción lleva tráfico a una ficha, pero desde ahí el cliente explora todo lo demás. Un producto representativo de lo que vendes trae visitas más útiles que un reclamo desconectado de tu catálogo."
        ],
      },
    ],
  },
  "sconti-e-codici-sconto": {
    title: "Descuentos y códigos de descuento",
    description: "Cómo crear un código de descuento eficaz, y un punto importante que conviene saber si vendes en un carrito compartido con otros vendedores.",
    sections: [
      {
        heading: "Cómo crear un código de descuento",
        paragraphs: [
          "Desde la sección Descuentos puedes crear un código personalizado, en porcentaje o en importe fijo, con un límite de usos y una fecha de caducidad opcionales, y — si quieres — limitarlo a productos específicos en lugar de a todo el catálogo. El código lo comunicas tú mismo a los clientes (email, redes sociales, tarjeta de visita) — Oralzon no lo publicita automáticamente en ningún sitio."
        ],
      },
      {
        heading: "Importante: tu código solo se aplica a tus productos",
        paragraphs: [
          "Oralzon es un marketplace multivendedor: un cliente puede tener en el carrito productos tuyos junto con productos de otros vendedores en el mismo pedido. Un punto fundamental que hay que tener claro: un código de descuento que crees tú se aplica exclusivamente a las líneas de tu tienda en ese carrito, nunca a los productos de otro vendedor. Ningún vendedor puede, ni siquiera por error, reducir involuntariamente el margen de otro a través de su propio código de descuento."
        ],
      },
      {
        heading: "Un umbral mínimo razonable",
        paragraphs: [
          "Establecer un importe mínimo de pedido para usar el código (por ejemplo, \"válido a partir de 50€\") suele ser más eficaz que un descuento pequeño sin umbral: anima al cliente a añadir algo más al carrito para alcanzar el umbral, en lugar de limitarse a la compra mínima que ya tenía en mente."
        ],
      },
    ],
  },
  "come-usare-le-sponsorizzazioni": {
    title: "Cómo usar los patrocinios",
    description: "Las opciones disponibles en Promociones, y cómo elegir la adecuada según lo que quieras conseguir.",
    sections: [
      {
        heading: "Cuatro tipos de visibilidad, cuatro objetivos distintos",
        paragraphs: [
          "Productos Destacados coloca hasta 5 de tus productos en la portada y en los resultados de búsqueda — la opción adecuada cuando quieres dar impulso a productos concretos, quizá novedades o artículos con mejor margen. Patrocinio de Portada te da una posición rotativa o fija en la sección de patrocinados de la portada — más indicado para construir reconocimiento de tu tienda en conjunto, no de un producto concreto. Patrocinio de Categoría te da visibilidad privilegiada en una o varias categorías a elegir — útil si quieres que te vean quienes ya están buscando precisamente el tipo de producto que vendes. Patrocinado Hero te coloca solo, sin otros productos alrededor, en una tarjeta destacada contextual a la categoría que el cliente está viendo en ese momento — aparece en varios puntos entre inicio, catálogo y página de producto."
        ],
      },
      {
        heading: "Patrocinado Hero: nunca más de uno tuyo a la vez",
        paragraphs: [
          "Puedes comprar este paquete para tantos productos como quieras — no hay límite de cuántos puedes tener patrocinados. El límite se refiere a lo que ve el cliente en un momento concreto: en la misma página nunca aparece más de un producto tuyo a la vez, aunque hayas patrocinado varios — el sistema hace rotar cuál de tus productos mostrar, tanto en el tiempo como entre los distintos puntos de la portada donde aparece este formato. Esto garantiza que el espacio se reparta equitativamente entre todos los patrocinadores, sin que lo monopolice quien más compra."
        ],
      },
      {
        heading: "Mira las estadísticas antes de elegir qué patrocinar",
        paragraphs: [
          "La sección Estadísticas muestra qué productos ya están generando visualizaciones y ventas orgánicas — suelen ser los mejores candidatos a patrocinar, porque el patrocinio amplifica un interés que ya existe en lugar de tener que crearlo desde cero. Patrocinar un producto que no vende nada rara vez invierte la tendencia por sí solo."
        ],
      },
      {
        heading: "El código de descuento en el pago del patrocinio",
        paragraphs: [
          "Si tienes un código de descuento válido para los paquetes de visibilidad, lo introduces en el paso de confirmación que se abre al hacer clic en \"Comprar\" sobre un paquete concreto — no antes. El precio final con el descuento aplicado es el que ves justo antes de proceder al pago, nunca una sorpresa después."
        ],
      },
    ],
  },
};