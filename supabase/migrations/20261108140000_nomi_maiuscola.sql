-- Migrazione 8 – Nome e cognome con l'iniziale maiuscola
--
-- Se un cliente scrive "simona rossi", il database salva "Simona Rossi".
-- Mette la maiuscola solo dove manca: non tocca il resto della parola, così
-- "McDonald" resta "McDonald" e "DE LUCA" resta com'è.
-- Vale per ogni parola: "maria grazia" → "Maria Grazia", "d'angelo" →
-- "D'Angelo", "rossi-bianchi" → "Rossi-Bianchi".
--
-- Lo fa un trigger sulla tabella customers, che scatta prima di ogni
-- inserimento o modifica: vale per la registrazione dal sito, per i profili
-- inseriti a mano dall'SQL Editor e per le modifiche future.
-- In fondo sistema anche i nomi già salvati.
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola.


-- La regola: maiuscola la prima lettera del testo e ogni lettera che viene
-- dopo uno spazio, un apostrofo o un trattino.
create function public.capitalize_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select string_agg(
    case
      when i = 1 or substr(p_name, i - 1, 1) in (' ', '''', '’', '-')
        then upper(substr(p_name, i, 1))
      else substr(p_name, i, 1)
    end,
    '' order by i
  )
  from generate_series(1, char_length(p_name)) as i;
$$;


-- La funzione del trigger: sistema nome e cognome della riga che sta per
-- essere salvata ("new")
create function public.capitalize_customer_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.first_name := public.capitalize_name(new.first_name);
  new.last_name := public.capitalize_name(new.last_name);
  return new;
end;
$$;

-- Servono solo al database, non al sito
revoke execute on function public.capitalize_name(text) from public, anon, authenticated;
revoke execute on function public.capitalize_customer_name() from public, anon, authenticated;

create trigger customers_capitalize_name
  before insert or update of first_name, last_name on public.customers
  for each row execute function public.capitalize_customer_name();


-- I nomi già salvati: "rimetterli uguali" fa scattare il trigger qui sopra
update public.customers
set first_name = first_name, last_name = last_name;
