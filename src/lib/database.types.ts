/**
 * TIPI DEL DATABASE
 *
 * PERCHE' QUESTO FILE E' PERMISSIVO. Fino a oggi conteneva una descrizione
 * scritta a mano di 5 tabelle su una trentina, e per giunta obsoleta: alle
 * tabelle descritte mancavano colonne realmente esistenti (products.status,
 * products.is_hero_sponsored, profiles.preferred_language e altre).
 *
 * Un file del genere non e' semplicemente incompleto, e' dannoso: segnala
 * come errori centinaia di query corrette — supabase-js risolve a `never`
 * ogni tabella che non trova qui — e contemporaneamente non intercetta
 * nessun errore vero, perche' le colonne che descrive non corrispondono al
 * database. E' il motivo per cui il controllo dei tipi in questo progetto
 * non e' mai stato acceso: acceso, produceva 114 errori inesistenti.
 *
 * Meglio dichiarare onestamente che i tipi del database non ci sono,
 * piuttosto che tenerne di finti. Cosi' il controllo dei tipi resta utile
 * per tutto il resto — variabili non definite, proprieta' inesistenti,
 * chiamate sbagliate, import mancanti — che e' la classe di errori che
 * arriva davvero in produzione. Il caso concreto che ha aperto la
 * questione: `i18n.language` usato in un file dove `i18n` non era
 * destrutturato. La build passava, la pagina sarebbe esplosa all'apertura.
 *
 * COME AVERE I TIPI VERI: `npm run types:gen`, che li rigenera dal database
 * con la CLI di Supabase. Da rieseguire dopo ogni migrazione che cambia lo
 * schema. Quando il file generato sara' in uso, questa versione permissiva
 * andra' semplicemente sostituita — e a quel punto il controllo dei tipi
 * coprira' anche le query.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TabellaGenerica = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: { [nomeTabella: string]: TabellaGenerica };
    Views: { [nomeVista: string]: TabellaGenerica };
    Functions: { [nomeFunzione: string]: { Args: Record<string, any>; Returns: any } };
    Enums: { [nomeEnum: string]: string };
    CompositeTypes: { [nomeTipo: string]: Record<string, any> };
  };
}
