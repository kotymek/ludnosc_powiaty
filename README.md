# Polska w skali mieszkańców

**Kartogram anamorficzny ludności powiatów, 1999–2025.** Powierzchnia powiatu jest proporcjonalna do jego liczby mieszkańców. Suwak roku i animacja rzeczywiście zmieniają geometrię; kolor jest dodatkową informacją o zmianie populacji.

**Strona: https://kotymek.github.io/ludnosc_powiaty/**

## Działanie

- Domyślny rocznik 1999; suwak z krokiem 1 rok, animacja z płynną interpolacją wierzchołków.
- Wspólna skala powierzchni we wszystkich 27 latach: nie dopasowujemy osobno każdego rocznika do okna. Gdy populacja maleje, maleje też obszar powiatu.
- Przełącznik „Zwykła mapa” do porównania z geograficznymi granicami.
- Wyszukiwarka, szczegóły, wykresy, eksport CSV i parametry widoku w URL. Układ mobilny i obsługa klawiatury. `prefers-reduced-motion` wyłącza interpolację.
- Roczne geometrie są wyliczone wcześniej. Strona ładuje skompresowany rocznik i buforuje pozostałe w tle. Odwiedzający nie uruchamia kosztownego algorytmu ani nie odpytuje GUS.

## Metoda i kontrola jakości

Algorytm Gastnera, Séguy i More’a (2018), [go-cart-wasm 0.5.0](https://github.com/riatelab/go-cart-wasm), port implementacji referencyjnej. Współrzędne wejściowe przekształcamy z długości/szerokości geograficznej w równopowierzchniowe odwzorowanie walcowe Lamberta (równoleżnik standardowy 52°). Zachowujemy pierścienie zewnętrzne, otwory i wieloczęściowe powiaty; silnik go-cart wymaga pierścieni zewnętrznych zgodnych z ruchem wskazówek zegara.

Po obliczeniu kartogramu normalizujemy powierzchnię tak, aby jedna jednostka kwadratowa odpowiadała jednej osobie (dla obserwacji niepustych). Następnie jeden wspólny transformator do SVG obejmuje cały zakres lat. Przeliczone, zaokrąglone współrzędne podlegają testowi powierzchni każdego powiatu w każdym roku: błąd względem populacji musi być mniejszy niż 1,2%. Dokładny maksymalny błąd przed zaokrągleniem zapisujemy w `data/cartograms/index.json` i wyświetlamy na stronie. Testujemy też identyczną strukturę wierzchołków dla animacji, domknięcie pierścieni oraz wzrost Warszawy i kurczenie się Łodzi między 1999 a 2025.

Interpolowane klatki pomiędzy latami są wyłącznie animacją, nie obserwacjami demograficznymi. Uproszczone granice PRG mogą mieć drobne szczeliny; mapa nie służy pomiarom geodezyjnym. Algorytm odkształca sąsiadujące obszary we wspólnym polu przepływu, zamiast niezależnie skalować nakładające się wielokąty.

## Dane i porównywalność

**GUS / Bank Danych Lokalnych**: [zmienna 72305](https://bdl.stat.gov.pl/api/v1/variables/72305?format=json), [P2137](https://bdl.stat.gov.pl/api/v1/subjects/P2137?format=json), „Ludność wg grup wieku i płci”, ogółem / ogółem, osoby, poziom 5 (powiaty). Metadane, data pobrania i 382 serie źródłowe są zachowane bez zmian w `data/population.json`. Dla porównania rok do roku w 1999 pobrano też 1998.

**GUGiK / PRG**: [oficjalna usługa Geoportalu](https://mapy.geoportal.gov.pl/wss/ims/maps/PRG_gugik_wyszukiwarka/FeatureServer/1), 380 współczesnych jednostek, uproszczenie serwera `maxAllowableOffset=0.003`, EPSG:4326.

**Nie jest to szereg w stałych granicach ani rekonstrukcja historycznych granic.** Populacje opisują ówczesne jednostki, a kształty wyjściowe pochodzą ze współczesnego PRG. Zmiany administracyjne i korekty po spisach mogą powodować skoki.

- Warszawa przed 2002: historyczny powiat warszawski **1431** jest pokazany na geometrii **1465**. Dawny zasięg nie jest identyczny z obecnym.
- Wałbrzych do 2002: historyczne miasto na prawach powiatu **0263** pokazujemy na geometrii **0265**.
- Odwołanie do historycznego kodu jest jawne w rocznych `observations`, w szczegółach powiatu i w metodologii. CSV i wykres łączą te obserwacje z obecną serią; oryginalny JSON pozostaje nienaruszony.
- 7 obecnych kodów nie ma obserwacji w latach 1999–2001, a Wałbrzych nie ma odrębnej obserwacji powiatowej w latach 2003–2012. Przekazujemy **NA**, nie 0. Silnik rezerwuje dla takich obszarów powierzchnię według udziału geograficznego; są zakreskowane i **ich powierzchnia nie oznacza populacji**. Nie szacujemy brakujących wartości. Dlatego w starszych latach suma powierzchni całej mapy nie jest miarą ludności Polski.

Kolory przedstawiają `(populacja roku / populacja odniesienia − 1) × 100%`. Skala jest stała osobno dla trybu rocznego i bazowego. Szrafowanie oznacza także brak roku odniesienia do koloru, mimo że powierzchnia może wtedy mieć znaną populację.

## Uruchomienie i odtworzenie

Node.js 22+. Strona statyczna nie wymaga instalowania zależności do uruchomienia:

```sh
node scripts/serve.mjs
# http://127.0.0.1:4173
node --test
```

Do ponownego obliczenia kartogramów:

```sh
pnpm install --frozen-lockfile
node scripts/build-cartograms.mjs
node scripts/pack-cartograms.mjs
node --test
```

Pierwszy skrypt pozwala podać lata jako argumenty i wytwarza lokalne, ignorowane surowe pliki JSON. Drugi pakuje komplet roczników, stosuje wspólną skalę i zapisuje śledzone `.json.gz` oraz indeks. Obsługę `NA` wywołujemy przez interfejs FS/ccall silnika, ponieważ wygodna funkcja `makeCartogram` biblioteki zastępuje braki zerami.

`node scripts/fetch-data.mjs` odświeża GUS i granice; po zmianach trzeba przeliczyć geometrie i sprawdzić metodologię. Obecny zakres interfejsu i testów to 1999–2025. Nie ma automatycznego odświeżania danych.

GitHub Pages publikuje `main`, folder `/`. Google Fonts jest opcjonalne; w razie braku dostępu działają fonty systemowe. Dekompresja geometrii używa standardowego `DecompressionStream` we współczesnych przeglądarkach.
