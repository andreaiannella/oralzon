import type { LegalDocument } from '../legalContent';

/**
 * Polska wersja tekstów prawnych.
 *
 * Dwie świadome decyzje translatorskie:
 *
 * 1. Dane operatora ograniczają się na razie do "Oralzon", bez nazwy
 *    firmy, siedziby i numeru VAT. To świadoma decyzja tymczasowa: dane
 *    istnieją i wymagają uzupełnienia.
 *    Zobacz docs/dati-societari-mancanti.md.
 *
 * 2. Odesłania do prawa włoskiego (kodeks konsumencki, kodeks cywilny, sąd
 *    w Cassino) NIE są zastępowane polskimi odpowiednikami, lecz wyraźnie
 *    oznaczone jako prawo włoskie. Umowa podlega prawu włoskiemu (pkt 11);
 *    przełożenie ich na prawo polskie byłoby merytorycznie nieprawdziwe i
 *    tworzyłoby błędne oczekiwania.
 */

const TERMINI_SERVIZIO_PL: LegalDocument = {
  title: "Warunki Świadczenia Usług",
  lastUpdated: "Sierpień 2026",
  sections: [
    {
      heading: "1. Kim jesteśmy i co regulują niniejsze warunki",
      paragraphs: [
        "Oralzon jest internetową usługą pośrednictwa, która łączy dostawców produktów stomatologicznych (**sprzedawców**) z profesjonalnymi podmiotami z branży (**kupującymi**). Oralzon nie sprzedaje kupującym własnych produktów za pośrednictwem tej usługi: każda umowa sprzedaży zawierana jest bezpośrednio między sprzedawcą a kupującym.",
        "Operatorem platformy jest **Oralzon**, kontakt: support@oralzon.com.",
        "Korzystając z platformy, akceptujesz niniejsze Warunki. Jeśli ich nie akceptujesz, nie możesz z niej korzystać. Warunki Sprzedaży, Polityka Prywatności i Polityka Plików Cookie stanowią ich integralną część."
      ],
    },
    {
      heading: "2. Kto może korzystać z Oralzon",
      paragraphs: [
        "Oralzon jest zastrzeżona dla podmiotów działających w ramach swojej działalności zawodowej lub gospodarczej i posiadających ważny numer VAT. Nie jest skierowana do konsumentów: w konsekwencji **nie mają zastosowania środki ochronne włoskiego kodeksu konsumenckiego** (D.Lgs. 206/2005), które dotyczą wyłącznie osób fizycznych działających w celach niezwiązanych z ich działalnością.",
        "Sprzedawcy muszą mieć siedzibę w jednym z 27 państw członkowskich Unii Europejskiej. Wymóg ten wynika z przepisów VAT dotyczących domniemanego dostawcy (art. 14a dyrektywy 2006/112/WE) i nie podlega odstępstwom.",
        "Odpowiadasz za prawdziwość podanych danych, za ochronę swoich danych logowania oraz za wszystko, co dzieje się za pośrednictwem Twojego konta."
      ],
    },
    {
      heading: "3. Zmiany niniejszych warunków",
      paragraphs: [
        "Możemy zmieniać niniejsze Warunki. Zmiany są przekazywane sprzedawcom pocztą elektroniczną i publikowane na platformie **co najmniej 15 dni przed** wejściem w życie, zgodnie z art. 3 rozporządzenia (UE) 2019/1150. Jeżeli zmiana wymaga istotnych dostosowań technicznych lub handlowych, okres powiadomienia jest odpowiednio dłuższy.",
        "W okresie powiadomienia sprzedawca może wypowiedzieć umowę bez kosztów. Publikacja nowych produktów lub brak wypowiedzenia w terminie oznaczają akceptację.",
        "Okres powiadomienia nie ma zastosowania, gdy zmiana wynika z obowiązku prawnego lub służy przeciwdziałaniu bezpośredniemu zagrożeniu bezpieczeństwa platformy lub jej użytkowników."
      ],
    },
    {
      heading: "4. Jak produkty są uszeregowane (plasowanie)",
      paragraphs: [
        "W wykonaniu art. 5 rozporządzenia (UE) 2019/1150 wskazujemy główne parametry decydujące o pozycji produktów w wynikach wyszukiwania i w sekcjach platformy oraz ich względne znaczenie.",
        "Wyniki wyszukiwania są porządkowane przez połączenie **zgodności z wyszukiwanym hasłem** z kilkoma parametrami dotyczącymi produktu. Zgodność pozostaje czynnikiem dominującym: pozostałe parametry ustalają kolejność **pomiędzy produktami równie trafnymi**, a nie po to, by umieścić produkt mniej trafny przed bardziej trafnym."
      ],
      bullets: [
        "**Zgodność z wyszukiwaniem** — parametr nadrzędny, którego żaden inny nie może odwrócić. Wyszukiwanie porównuje wpisane hasło z nazwą produktu (również przetłumaczoną), marką, kodem artykułu i opisem, z malejącą wagą w tej kolejności: zgodność w nazwie liczy się więcej niż to samo słowo występujące tylko w opisie",
        "**Filtry i sortowanie wybrane przez kupującego** — gdy kupujący sortuje według ceny, ten wybór ma pierwszeństwo przed każdym innym parametrem, w tym przed pozycjami płatnymi",
        "**Dostępność** — przy równej zgodności produkt dostępny wyprzedza wyczerpany. To drugi parametr pod względem wagi, ponieważ wynik, którego nie można kupić, nie służy ani kupującemu, ani sprzedawcy. Produkty wyczerpane pozostają jednak widoczne i nie są usuwane z wyników",
        "**Zrealizowana sprzedaż** — przy równej zgodności produkt już kupiony przez innych profesjonalistów wyprzedza produkt bez historii sprzedaży. Efekt jest narastający, ale malejący: różnica między brakiem sprzedaży a pierwszymi transakcjami liczy się znacznie więcej niż ta między wieloma a bardzo wieloma, dzięki czemu produkt ugruntowany nie zajmuje pozycji na stałe",
        "**Otrzymane opinie** — średnia ocen, ważona ich liczbą: kilka doskonałych opinii waży mniej niż wiele dobrych. Opinie są dopuszczalne wyłącznie od kupujących, którzy faktycznie nabyli ten produkt na platformie",
        "**Produkty niedawno opublikowane** — produkty opublikowane niedawno otrzymują wyraźną przewagę w pozycjonowaniu, która stopniowo maleje w ciągu pierwszych trzech miesięcy. To decyzja świadoma: bez niej marketplace trwale faworyzowałby tych, którzy już sprzedają, a sprzedawca wchodzący dziś nie miałby jak zacząć",
        "**Pozycjonowanie płatne** — sprzedawcy mogą nabyć pakiety widoczności (produkty wyróżnione, miejsca na stronie głównej, miejsca w kategoriach, karty kontekstowe). Takie treści są **zawsze oznaczone jako „Sponsorowane”**. W wynikach wyszukiwania sponsoring **dodaje się** do punktacji produktu, a nie mnoży jej: może więc przeważyć przy równej zgodności, ale **nie może umieścić produktu mało trafnego nad bardzo trafnym**. Gdy miejsce płatne jest dostępne, lecz żaden sprzedawca go nie nabył, pokazujemy produkt niesponsorowany z neutralnym oznaczeniem „Wyróżnione”, nie przypisując mu nieistniejącego sponsoringu",
        "**Historia zakupów i przeglądania kupującego** — używana do proponowania trafnych produktów, na podstawie danych zbieranych wyłącznie na tej platformie. Nie wpływa na ceny ani warunki i nigdy nie ma pierwszeństwa przed wyraźnymi wyborami kupującego ani przed miejscami płatnymi",
        "**Brak preferencji dla sprzedawców** — staż, całkowity wolumen sprzedaży sprzedawcy, wybrany plan oraz ewentualny zakup innych usług nie mają żadnego wpływu na pozycjonowanie jego produktów. Oralzon nie sprzedaje własnych produktów i nie ma zatem pozycji do faworyzowania"
      ],
    },
    {
      heading: "5. Obowiązki sprzedawców",
      bullets: [
        "Być prawidłowo utworzonymi podmiotami prawnymi, z ważnym numerem VAT w państwie członkowskim Unii Europejskiej",
        "Publikować kompletne, rzetelne i nie wprowadzające w błąd informacje o produkcie, w tym oznaczenia wymagane przepisami prawa",
        "Zapewnić, że produkty sklasyfikowane jako wyroby medyczne spełniają rozporządzenie (UE) 2017/745 (MDR) oraz wszelkie inne mające zastosowanie przepisy",
        "Utrzymywać aktualne stany magazynowe i realizować otrzymane zamówienia w deklarowanych terminach",
        "Organizować wysyłkę własnych produktów i wprowadzać dane do śledzenia przesyłek",
        "Wykorzystywać dane kupujących wyłącznie w celu realizacji zamówienia, z poszanowaniem RODO",
        "**Nie wyprowadzać kupujących poza platformę**: zabronione jest zamieszczanie bezpośrednich danych kontaktowych (adres e-mail, telefon, komunikatory, strony osób trzecich) w opisach produktów, w odpowiedziach na pytania, w opiniach, na zdjęciach lub w materiałach dołączanych do przesyłek, w celu zawierania poza Oralzon transakcji powstałych na platformie",
        "Samodzielnie wypełniać wszystkie obowiązki podatkowe, w tym informacje podsumowujące o wewnątrzwspólnotowych dostawach (Intrastat), gdy są należne: Oralzon nie składa ich w imieniu sprzedawcy"
      ],
    },
    {
      heading: "6. Ograniczenie, zawieszenie i zakończenie świadczenia usługi",
      paragraphs: [
        "W wykonaniu art. 4 rozporządzenia (UE) 2019/1150, ograniczając lub zawieszając usługi wobec sprzedawcy, przekazujemy mu **konkretne powody** decyzji na trwałym nośniku, najpóźniej w chwili, w której środek staje się skuteczny.",
        "Jeżeli zdecydujemy o całkowitym zaprzestaniu świadczenia usług, okres powiadomienia wynosi **co najmniej 30 dni**, chyba że zachodzi obowiązek prawny, poważne i powtarzające się naruszenie niniejszych Warunków albo konkretne zagrożenie bezpieczeństwa użytkowników lub integralności usługi.",
        "Sprzedawca może zakwestionować decyzję w trybie reklamacyjnym z pkt 7. Jeżeli odwołanie zostanie uwzględnione, środek jest uchylany bez zbędnej zwłoki.",
        "Upływ okresu próbnego lub planu sprzedawcy, gdy nie zostanie odnowiony, nie jest sankcją: reguluje go Warunki Sprzedaży i poprzedzają go stosowne powiadomienia.",
        "**Zamówienia otrzymane przed zawieszeniem pozostają ważne** i muszą zostać zrealizowane. Odpowiadające im kwoty są wypłacane na zasadach zwykłych."
      ],
    },
    {
      heading: "7. Reklamacje i rozstrzyganie sporów",
      paragraphs: [
        "Każdy sprzedawca może złożyć reklamację, pisząc na adres **support@oralzon.com** i wskazując przedmiot zastrzeżeń. Rozpatrujemy reklamacje w rozsądnych terminach, proporcjonalnych do ich złożoności, a wynik przekazujemy indywidualnie i jasnym językiem.",
        "Operator platformy jest obecnie małym przedsiębiorstwem w rozumieniu art. 11 ust. 5 rozporządzenia (UE) 2019/1150 i nie ma w związku z tym obowiązku ustanowienia sformalizowanego wewnętrznego systemu rozpatrywania reklamacji. Utrzymujemy jednak opisaną wyżej procedurę.",
        "W razie braku porozumienia strony mogą zwrócić się pozasądowo do organu mediacyjnego wpisanego do rejestru prowadzonego przez włoskie Ministerstwo Sprawiedliwości i właściwego w sprawach handlowych. Skorzystanie z mediacji nie narusza prawa do wystąpienia na drogę sądową.",
        "Prawa przyznane organizacjom reprezentującym sprzedawców na mocy art. 14 tego samego rozporządzenia pozostają nienaruszone."
      ],
    },
    {
      heading: "8. Dostęp do danych",
      paragraphs: [
        "Sprzedawca ma dostęp, ze swojego panelu, do danych generowanych przez jego działalność: otrzymane zamówienia, sprzedane produkty, obroty, opinie, pytania klientów, przelewy i zestawienia podatkowe.",
        "Nie udostępniamy sprzedawcom adresu e-mail ani numeru telefonu kupujących. Otrzymują natomiast imię i nazwisko, adres dostawy oraz dane do faktury, niezbędne do dostarczenia towaru i wystawienia faktury. Rozwiązanie to chroni kupujących przed niezamówionymi kontaktami i zachowuje możliwość prześledzenia wymiany w razie sporu.",
        "Nie przekazujemy osobom trzecim zagregowanych danych generowanych na platformie do ich własnych celów handlowych."
      ],
    },
    {
      heading: "9. Własność intelektualna i treści",
      paragraphs: [
        "Sprzedawca zachowuje wszelkie prawa do publikowanych przez siebie treści i gwarantuje, że jest do nich uprawniony. Udziela Oralzon niewyłącznej i nieodpłatnej licencji na ich publikowanie, automatyczne tłumaczenie na języki platformy i wykorzystywanie w promocji katalogu, ograniczonej do czasu trwania relacji.",
        "Znaki towarowe, interfejsy, teksty redakcyjne i oprogramowanie platformy należą do operatora i nie mogą być powielane bez zezwolenia.",
        "Usuwamy treści bezprawne, wprowadzające w błąd lub naruszające niniejsze Warunki, informując o tym autora wraz ze wskazaniem powodów."
      ],
    },
    {
      heading: "10. Odpowiedzialność",
      paragraphs: [
        "Oralzon odpowiada za funkcjonowanie platformy technologicznej i za prawidłowość informacji, które sama udostępnia. Nie jest stroną umowy sprzedaży i nie odpowiada za jakość, zgodność ani bezpieczeństwo produktów, za zachowanie sprzedawców ani za terminy dostawy, które obciążają wyłącznie sprzedawcę.",
        "Z wyjątkiem winy umyślnej lub rażącego niedbalstwa oraz szkód na osobie, łączna odpowiedzialność Oralzon wobec sprzedawcy jest ograniczona do kwot uiszczonych przez niego na rzecz platformy w ciągu dwunastu miesięcy poprzedzających zdarzenie. Wobec kupującego jest ograniczona do wartości zamówienia, którego dotyczy zastrzeżenie.",
        "Żadne postanowienie niniejszych Warunków nie wyłącza ani nie ogranicza odpowiedzialności w zakresie, w jakim prawo właściwe na to nie zezwala."
      ],
    },
    {
      heading: "11. Prawo właściwe i sąd właściwy",
      paragraphs: [
        "Niniejsze Warunki podlegają prawu włoskiemu.",
        "Dla wszelkich sporów wyłącznie właściwy jest sąd w Cassino (Włochy). Ponieważ chodzi o relacje między przedsiębiorcami, strony uznają, że przyznanie tej właściwości zostało uzgodnione na piśmie w rozumieniu art. 25 rozporządzenia (UE) 1215/2012.",
        "W przypadku rozbieżności z tłumaczeniami rozstrzygająca jest włoska wersja niniejszych Warunków."
      ],
    },
  ],
};

const CONDIZIONI_VENDITA_PL: LegalDocument = {
  title: "Warunki Sprzedaży",
  lastUpdated: "Sierpień 2026",
  sections: [
    {
      heading: "1. Zakres zastosowania",
      paragraphs: [
        "Niniejsze Warunki regulują zakupy dokonywane za pośrednictwem Oralzon przez profesjonalne podmioty z branży stomatologicznej. Produkty są sprzedawane przez zarejestrowanych dostawców (sprzedawców): umowa zawierana jest między sprzedawcą a kupującym, natomiast Oralzon występuje jako pośrednik technologiczny i podmiot upoważniony do inkasa.",
        "Ponieważ kupujący zawsze działa w ramach swojej działalności, **nie mają zastosowania środki ochronne włoskiego kodeksu konsumenckiego** (D.Lgs. 206/2005), zastrzeżone dla konsumentów."
      ],
    },
    {
      heading: "2. Zamówienia i potwierdzenie",
      paragraphs: [
        "Zamówienie dochodzi do skutku z chwilą potwierdzenia płatności. Kupujący otrzymuje niezwłocznie wiadomość e-mail z numerem zamówienia i podsumowaniem, która stanowi przyjęcie oferty sprzedawcy.",
        "Rozpoczęte i niedokończone płatności nie prowadzą do powstania zamówienia i są automatycznie anulowane po upływie 24 godzin.",
        "Dostępność produktów jest weryfikowana w momencie składania zamówienia. Jeżeli wskutek równoczesnych zakupów dany artykuł okaże się niedostępny po potwierdzeniu, sprzedawca informuje o tym, a niezrealizowana część podlega zwrotowi."
      ],
    },
    {
      heading: "3. Ceny, VAT i płatność",
      bullets: [
        "Ceny podawane są w euro. W sprzedaży krajowej zawierają VAT według stawki obowiązującej w kraju sprzedawcy",
        "W przypadku sprzedaży między sprzedawcą a kupującym mającymi siedzibę w dwóch różnych państwach członkowskich Unii Europejskiej, gdy obaj posiadają numer VAT potwierdzony w systemie VIES, stosuje się odwrotne obciążenie: wynagrodzenie nie obejmuje VAT, a kupujący rozlicza podatek we własnym kraju, zgodnie ze wskazaniem na fakturze",
        "Jeżeli weryfikacja w VIES nie da wyniku pozytywnego dla jednej ze stron, stosuje się VAT kraju sprzedawcy",
        "Płatność następuje kartą kredytową lub debetową i jest obsługiwana przez Stripe. Oralzon nie przetwarza ani nie przechowuje danych kart",
        "Kwota jest wymagalna w całości w momencie złożenia zamówienia",
        "Fakturę wystawia sprzedawca, jako jedyny podmiot do tego zobowiązany: Oralzon dostarcza niezbędne dane, ale nie wystawia faktury w jego imieniu"
      ],
    },
    {
      heading: "4. Prowizja i plan sprzedawcy",
      paragraphs: [
        "Od każdej zawartej transakcji Oralzon pobiera prowizję w wysokości **7 % wartości towaru** (podstawa opodatkowania, bez VAT), potrącaną z kwoty wypłacanej sprzedawcy. Prowizja pokrywa koszty obsługi płatności i usługi platformy.",
        "**Prowizji nie nalicza się od kosztów wysyłki**, które nie stanowią przychodu platformy.",
        "Dostęp do platformy wymaga ponadto rocznego planu sprzedawcy, na warunkach wskazanych na dedykowanej stronie w momencie zawarcia. Po zakończeniu bezpłatnego okresu próbnego brak subskrypcji powoduje zawieszenie sprzedaży, poprzedzone powiadomieniami e-mail przed upływem terminu i w kolejnych dniach. Katalog, zamówienia i statystyki pozostają zarchiwizowane i stają się ponownie dostępne po aktywacji planu.",
        "Ewentualne zmiany stawki prowizji są przekazywane pocztą elektroniczną z co najmniej 30-dniowym wyprzedzeniem i nie mają zastosowania do zamówień już otrzymanych."
      ],
    },
    {
      heading: "5. Wysyłka",
      paragraphs: [
        "Każdy sprzedawca samodzielnie wysyła swoje produkty. W zamówieniach obejmujących wielu dostawców produkty są wysyłane osobno, z odrębnymi kosztami i śledzeniem dla każdego sprzedawcy.",
        "Koszty wysyłki ustala sprzedawca dla poszczególnych stref docelowych i są one prezentowane kupującemu przed płatnością, w rozbiciu na dostawców. Sprzedawca może określić próg wartości zamówienia, powyżej którego wysyłka jest bezpłatna: w takim przypadku koszt transportu obciąża jego.",
        "Terminy dostawy wskazane w opisach produktów są szacunkowe i niewiążące. Oralzon realizuje wysyłkę wyłącznie na terenie Unii Europejskiej.",
        "Kupujący otrzymuje pocztą elektroniczną numer przesyłki w chwili nadania i jest proszony o potwierdzenie odbioru w sekcji zamówień. W braku potwierdzenia dostawę uznaje się za dokonaną po upływie 7 dni od nadania w przypadku przesyłek krajowych i 15 dni w przypadku przesyłek wewnątrzwspólnotowych."
      ],
    },
    {
      heading: "6. Wypłata dla sprzedawcy",
      paragraphs: [
        "Pobrane kwoty pozostają u Oralzon do czasu potwierdzenia dostawy, ręcznego lub automatycznego zgodnie z pkt 5. Dopiero wówczas kwota netto jest przekazywana sprzedawcy na powiązane konto.",
        "Rozwiązanie to chroni obie strony: pozwala rozpatrzyć zwrot lub reklamację, zanim środki zostaną przelane, i zapewnia sprzedawcy automatyczną wypłatę bez konieczności ponaglania.",
        "Otwarty wniosek o zwrot wstrzymuje wypłatę dotyczącą danego artykułu do czasu zakończenia sprawy.",
        "Aby otrzymywać wypłaty, sprzedawca musi zakończyć weryfikację tożsamości wymaganą przez dostawcę usług płatniczych. Do tego czasu kwoty pozostają zarezerwowane i nie przepadają."
      ],
    },
    {
      heading: "7. Zwroty i refundacje",
      paragraphs: [
        "Ponieważ chodzi o sprzedaż między przedsiębiorcami, **nie przysługuje ustawowe prawo odstąpienia od umowy**. Oralzon uznaje jednak, w ramach własnej polityki handlowej, możliwość złożenia wniosku o zwrot w terminie **30 dni** od dostawy, na poniższych warunkach.",
        "Wniosek składa się w sekcji „Moje zamówienia” i może dotyczyć również części zakupionych ilości. Sprzedawca rozpatruje go i może go uwzględnić albo odrzucić, uzasadniając decyzję.",
        "Produkty muszą zostać zwrócone nienaruszone, w nieotwartym oryginalnym opakowaniu i kompletne. **Ze zwrotu wyłączone są** wyroby jednorazowego użytku z otwartym lub uszkodzonym opakowaniem sterylnym, produkty wykonane na zamówienie, produkty szybko psujące się oraz takie, których bezpieczeństwa nie da się już zweryfikować po otwarciu.",
        "O ile nie uzgodniono inaczej, koszty zwrotu obciążają kupującego. Obciążają natomiast sprzedawcę, gdy produkt jest wadliwy, niezgodny z zamówieniem lub uszkodzony w transporcie.",
        "Refundacja jest obliczana od ceny faktycznie zapłaconej za zwrócone artykuły i realizowana tą samą metodą płatności w ciągu 14 dni od przyjęcia zwrotu. Sprzedawca może zatrzymać uzasadnioną część z tytułu utraty wartości niewynikającej ze sprawdzenia produktu.",
        "Niniejsza polityka nie narusza uprawnień z tytułu rękojmi za wady rzeczy sprzedanej przewidzianych we włoskim kodeksie cywilnym, które pozostają zastrzeżone."
      ],
    },
    {
      heading: "8. Gwarancja i zgodność produktów",
      paragraphs: [
        "Sprzedawca gwarantuje, na swoją wyłączną odpowiedzialność, że publikowane produkty są zgodne z mającymi zastosowanie przepisami, w tym z rozporządzeniem (UE) 2017/745 w sprawie wyrobów medycznych, oraz że dysponuje tytułami niezbędnymi do ich wprowadzania do obrotu.",
        "Oralzon weryfikuje dane identyfikacyjne i podatkowe podane przy rejestracji, ale nie bada ani nie certyfikuje zgodności poszczególnych produktów, która pozostaje w całości po stronie sprzedawcy.",
        "Do sprzedaży stosuje się rękojmię za wady przewidzianą w art. 1490 i nast. włoskiego kodeksu cywilnego, w relacjach między sprzedawcą a kupującym."
      ],
    },
    {
      heading: "9. Opinie i pytania",
      paragraphs: [
        "Opinię mogą wystawić wyłącznie kupujący, którzy rzeczywiście nabyli produkt: weryfikacja jest automatyczna i nie da się jej obejść.",
        "Opinie i pytania są publiczne i zawierają imię autora. Nie jest dozwolone zamieszczanie w nich bezpośrednich danych kontaktowych ani treści zniesławiających, bezprawnych lub niezwiązanych z produktem.",
        "Nie usuwamy negatywnych opinii na żądanie sprzedawcy, który może jednak odpowiedzieć publicznie. Usuwamy treści naruszające te zasady, informując o tym autora."
      ],
    },
    {
      heading: "10. Prawo właściwe i sąd właściwy",
      paragraphs: [
        "Niniejsze Warunki podlegają prawu włoskiemu. Dla wszelkich sporów wyłącznie właściwy jest sąd w Cassino (Włochy), zgodnie z art. 25 rozporządzenia (UE) 1215/2012, ponieważ chodzi o relacje między przedsiębiorcami.",
        "W przypadku rozbieżności z tłumaczeniami rozstrzygająca jest wersja włoska."
      ],
    },
    {
      heading: "11. Kontakt",
      paragraphs: [
        "Wszelkie informacje dotyczące niniejszych Warunków: **support@oralzon.com**"
      ],
    },
  ],
};

export const PL_LEGAL: { termini: LegalDocument; condizioni: LegalDocument } = {
  termini: TERMINI_SERVIZIO_PL,
  condizioni: CONDIZIONI_VENDITA_PL,
};
