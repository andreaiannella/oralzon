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
          "Antes de subir productos, conviene completar el perfil de la tienda en Ajustes: nombre, descripción, logotipo e información de envío. Un perfil de tienda incompleto suele ser el primer motivo por el que un cliente potencial duda en comprar a un vendedor nuevo — encuentra el producto adecuado, pero no suficiente información sobre la tienda como para confiar."
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
          "Una reseña negativa sin respuesta pública del vendedor pesa más que la propia reseña: comunica que el problema no se abordó. Una respuesta pública, aunque sea breve, que reconoce el problema y explica qué se hizo, recupera gran parte de la confianza perdida — a menudo más de lo que lo haría la misma reseña si hubiera sido positiva desde el principio."
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
    description: "Las herramientas que tienes a tu disposición para darte a conocer en la plataforma, más allá de la simple presencia en el catálogo.",
    sections: [
      {
        heading: "Tu código de referido personal",
        paragraphs: [
          "Cada vendedor tiene su propio código de referido, visible en el panel, para compartir con otras clínicas o distribuidores interesados en convertirse en vendedores de Oralzon. Quien se registra con tu código recibe un periodo de prueba ampliado, y tú recibes días adicionales de prueba gratuita como agradecimiento — una forma sencilla de ayudar a que la plataforma crezca en tu propio sector mientras te beneficias personalmente."
        ],
      },
      {
        heading: "Las reseñas son marketing, no solo feedback",
        paragraphs: [
          "Las reseñas que los clientes dejan en tus productos son visibles para cualquiera que visite la página de tu tienda o las fichas de producto — son, en la práctica, material de marketing generado por tus propios clientes, a menudo más convincente que cualquier descripción que puedas escribir. Conviene, después de un envío que haya ido bien, pedir amablemente al cliente que deje una reseña, en lugar de esperar a que ocurra por sí solo."
        ],
      },
      {
        heading: "La página de tu tienda es tu tarjeta de presentación",
        paragraphs: [
          "Muchos visitantes llegan a un producto a través de la búsqueda, pero luego hacen clic en el nombre del vendedor para ver el resto del catálogo — la página de la tienda es a menudo el punto en el que se decide si un cliente se convierte en habitual o se queda en una compra puntual. Una descripción de tienda cuidada y un catálogo organizado por categorías ayudan a retener a ese visitante."
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
        heading: "Tres tipos de visibilidad, tres objetivos distintos",
        paragraphs: [
          "Productos Destacados coloca hasta 5 de tus productos en la portada y en los resultados de búsqueda — la opción adecuada cuando quieres dar impulso a productos concretos, quizá novedades o artículos con mejor margen. Patrocinio de Portada te da una posición fija o rotativa en la sección de patrocinados de la portada — más indicado para construir reconocimiento de tu tienda en conjunto, no de un producto concreto. Patrocinio de Categoría te da visibilidad privilegiada en una o varias categorías a elegir — útil si quieres que te vean quienes ya están buscando precisamente el tipo de producto que vendes."
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