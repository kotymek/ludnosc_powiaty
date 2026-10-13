# Ludność powiatów — Atlas zmian

Interaktywny kartogram zmian liczby ludności polskich powiatów, **1999–2025**.

**Strona: https://kotymek.github.io/ludnosc_powiaty/**

## Funkcje

- Suwak z krokiem rocznym i animacja 1999–2025.
- Zmiana rok do roku (dla 1999 także pobrano wartości z 1998) lub względem dowolnego roku bazowego.
- Stała skala kolorów osobna dla każdego trybu, wyszukiwanie po nazwie/województwie/TERYT, powiększanie wokół wybranego powiatu.
- Liczba mieszkańców, zmiana procentowa i bezwzględna, wykres historii, CSV dla 380 współczesnych powiatów.
- Parametry widoku zapisane w adresie URL, obsługa klawiatury, układ mobilny.

## Dane i ograniczenia

Ludność: **GUS / Bank Danych Lokalnych**, zmienna [72305](https://bdl.stat.gov.pl/api/v1/variables/72305?format=json), podgrupa [P2137](https://bdl.stat.gov.pl/api/v1/subjects/P2137?format=json), „Ludność wg grup wieku i płci”, ogółem / ogółem, osoby. Dane pobrano bezpośrednio z API BDL na poziomie 5 (powiaty), bez sumowania gmin. Metadane i data pobrania są zapisane w `data/population.json`. Zachowano identyfikatory atrybutów inne niż standardowy 1; w pobranym zestawie takich atrybutów brak.

Granice: **GUGiK / Państwowy Rejestr Granic**, [oficjalna usługa Geoportalu](https://mapy.geoportal.gov.pl/wss/ims/maps/PRG_gugik_wyszukiwarka/FeatureServer/1). Geometria z usługi ArcGIS (pierścienie, z zachowaniem otworów), EPSG:4326, uproszczenie serwera `maxAllowableOffset=0.003`, 4 miejsca dziesiętne. SVG stosuje odwzorowanie Mercatora. Granice służą wizualizacji, nie pomiarom geodezyjnym. Identyfikatory TERYT łączone są z kodem województwa i powiatu w identyfikatorze BDL.

**To nie jest szereg o stałych granicach.** Geometria jest współczesna; liczby odnoszą się do podziału administracyjnego na 31 grudnia danego roku. Skoki mogą wynikać ze zmian terytorialnych i korekt po spisach. Nie rekonstruujemy populacji historycznej we współczesnych granicach. Nie interpolujemy ani nie zastępujemy braków zerami. Powiat warszawski (1431) i dawny kod Wałbrzycha (0263) są zachowane w źródłowym JSON, ale nie są automatycznie łączone z obecnymi jednostkami. Brak choć jednej wartości porównania oznacza szrafowanie. 380 obecnych powiatów ma wartości w 2025; w 1999 wartości ma 371 z obecnych kodów.

Zmiana = `(wartość końcowa / wartość bazowa - 1) * 100`. Przedziały roczne: −3, −2, −1, −0,25, +0,25, +1, +2, +3%; od roku bazowego: −30, −20, −10, −2, +2, +10, +20, +30%. Przedział zaczyna się włącznie na swoim dolnym progu. Wartości skrajne zachowują dokładne liczby w szczegółach. Podsumowanie zlicza wyłącznie 380 obszarów mapy, nie jest sumą ludności Polski.

## Uruchamianie

Wymagany Node.js 22 lub nowszy, brak zależności npm.

```sh
npm start
# http://127.0.0.1:4173
npm test
```

Strona jest statyczna. Dane są w repozytorium — odwiedzający nie odpytuje GUS ani Geoportalu. Google Fonts dostarcza opcjonalne fonty; w razie braku sieci działają fonty systemowe.

## Aktualizacja danych

```sh
npm run data
npm test
```

Skrypt sprawdza liczbę granic i kompletność połączenia. Przed publikacją kolejnego rocznika należy także zaktualizować zakres osi, etykiety, wykres, nazwę CSV i test referencyjny (obecna wersja interfejsu obejmuje świadomie 1999–2025). Należy ponownie sprawdzić metodologię GUS i zmiany terytorialne. Aktualizacja nie jest automatycznym zadaniem okresowym.

## Publikacja

GitHub Pages: branch `main`, folder `/` (root). Plik `.nojekyll` wyłącza Jekyll. Każdy push na `main` aktualizuje witrynę. Kod, dane, źródła i testy są w tym repozytorium.
