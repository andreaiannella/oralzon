-- Blocco dei contatti diretti in domande, risposte e recensioni.
-- Applicata in produzione il 13/08/2026.
--
-- Dopo la rimozione di logo e descrizione negozio, domande e recensioni
-- sono rimaste l'ULTIMO canale di testo libero pubblico fra cliente e
-- venditore. Senza controllo un venditore puo' rispondere "scrivimi a
-- mario@..." o "lo trovi a meta' prezzo sul mio sito": la porta aperta
-- esattamente dove abbiamo chiuso tutte le altre.
--
-- Il controllo sta nel DATABASE e non nel frontend perche' l'inserimento
-- parte direttamente dal client via supabase-js: in React sarebbe
-- aggirabile con una chiamata API diretta, cioe' inutile proprio contro
-- chi ha interesse ad aggirarlo. Stesso ragionamento delle recensioni.
CREATE OR REPLACE FUNCTION contains_direct_contact(txt text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE t text; only_digits text; url_match text;
BEGIN
  IF txt IS NULL OR txt = '' THEN RETURN NULL; END IF;
  t := lower(txt);
  IF t ~ '[a-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[a-z0-9.-]+\.[a-z]{2,}' THEN
    RETURN 'un indirizzo email'; END IF;
  -- Telefono: almeno 8 cifre, tollerando separatori usati per aggirare
  -- il controllo (es. "3 3 3 . 1 2 3 - 4 5 6 7")
  only_digits := regexp_replace(t, '[^0-9]', '', 'g');
  IF length(only_digits) >= 8 AND t ~ '(\+?[0-9][\s.\-/]*){8,}' THEN
    RETURN 'un numero di telefono'; END IF;
  IF t ~ '\m(whatsapp|telegram|wechat|viber|skype)\M' THEN
    RETURN 'un contatto di messaggistica'; END IF;
  url_match := substring(t from '((https?://)?[a-z0-9-]+\.(com|it|net|org|eu|de|fr|es|shop|store|info|biz))\M');
  IF url_match IS NOT NULL AND url_match !~ 'oralzon\.' THEN
    RETURN 'un sito esterno'; END IF;
  RETURN NULL;
END; $$;

CREATE OR REPLACE FUNCTION block_direct_contact_in_qa()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE reason text;
BEGIN
  reason := contains_direct_contact(NEW.question);
  IF reason IS NOT NULL THEN
    RAISE EXCEPTION 'La domanda sembra contenere %. Le Condizioni di Vendita non permettono di scambiare contatti diretti su Oralzon.', reason USING ERRCODE='check_violation'; END IF;
  reason := contains_direct_contact(NEW.vendor_reply);
  IF reason IS NOT NULL THEN
    RAISE EXCEPTION 'La risposta sembra contenere %. Le Condizioni di Vendita non permettono di indirizzare i clienti fuori da Oralzon.', reason USING ERRCODE='check_violation'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_qa_block_direct_contact ON product_questions;
CREATE TRIGGER trg_qa_block_direct_contact BEFORE INSERT OR UPDATE ON product_questions
  FOR EACH ROW EXECUTE FUNCTION block_direct_contact_in_qa();

CREATE OR REPLACE FUNCTION block_direct_contact_in_reviews()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE reason text;
BEGIN
  reason := contains_direct_contact(NEW.comment);
  IF reason IS NOT NULL THEN
    RAISE EXCEPTION 'La recensione sembra contenere %. Non e possibile scambiare contatti diretti su Oralzon.', reason USING ERRCODE='check_violation'; END IF;
  reason := contains_direct_contact(NEW.vendor_reply);
  IF reason IS NOT NULL THEN
    RAISE EXCEPTION 'La risposta sembra contenere %. Le Condizioni di Vendita non permettono di indirizzare i clienti fuori da Oralzon.', reason USING ERRCODE='check_violation'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_reviews_block_direct_contact ON product_reviews;
CREATE TRIGGER trg_reviews_block_direct_contact BEFORE INSERT OR UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION block_direct_contact_in_reviews();
