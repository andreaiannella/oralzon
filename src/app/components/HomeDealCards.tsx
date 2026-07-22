import { Link } from 'react-router-dom';

interface DealTile {
  img: string;
  alt: string;
}

interface DealCard {
  title: string;
  link: string;
  bg: string; // classi tailwind per lo sfondo del pannello
  titleColor?: string;
  tiles: DealTile[];
  loading?: boolean; // true finché non sappiamo ancora se ci sono prodotti veri
}

// Card compatte in stile Amazon: pannello colorato, titolo in alto, griglia
// 2x2 di prodotti/tile bianche sotto. Pensate per stare affiancate e
// scorrere orizzontalmente su mobile (come "I più amati scelti per te" /
// "I tuoi prodotti in offerta" nell'app Amazon), mantenendo però la
// palette e i contenuti del mondo dentale/Oralzon.
export function HomeDealCards({ cards }: { cards: DealCard[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:gap-4">
      {cards.map((card) => (
        <Link
          key={card.title}
          to={card.link}
          className={`w-[78vw] sm:w-auto flex-shrink-0 snap-start rounded-2xl p-4 pb-5 block transition-transform active:scale-[0.98] ${card.bg}`}
        >
          <h3 className={`font-bold text-lg leading-snug mb-3 ${card.titleColor || 'text-oralzon-steel-ink'}`}>
            {card.title}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {card.loading ? (
              // Skeleton neutro mentre non sappiamo ancora se ci sono
              // prodotti veri — niente più flash di contenuto sbagliato
              // (prima qui comparivano per un istante le icone categoria
              // di fallback, salvo poi sparire appena arrivavano i dati).
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white/60 rounded-xl aspect-square animate-pulse" />
              ))
            ) : (
              card.tiles.slice(0, 4).map((tile, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl aspect-square overflow-hidden flex items-center justify-center p-2.5 shadow-sm"
                >
                  <img src={tile.img} alt={tile.alt} className="w-full h-full object-contain" loading="lazy" />
                </div>
              ))
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
