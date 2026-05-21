# Ogród MVP (Next.js)

Prosta aplikacja webowa do zarządzania ogrodem (MVP) w języku polskim.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Lokalny zapis danych do pliku `data/db.json` (bez logowania i bez zewnętrznej bazy)

## Wymagania

- Node.js `>=20.9.0` (zalecane Node 22)

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Build i lint

```bash
npm run lint
npm run build
```

## Najważniejsze funkcje MVP

- Dashboard (`/`)
- Mapa ogrodu 24x120 (`/mapa`) z nazwą rośliny tylko w zajętych komórkach
- CRUD roślin (`/rosliny`)
- Import CSV siatki ogrodu w sekcji roślin z podsumowaniem importu
- CRUD grup (`/grupy`)
- CRUD produktów (`/produkty`)
- CRUD zabiegów (`/zabiegi`) z celem: roślina lub grupa
- Zabiegi typu: `spray` (oprysk) i `fertilization` (nawożenie)
- W zabiegach produkt można wybrać z listy lub wpisać ręcznie
- CRUD obserwacji powiązanych z roślinami (`/obserwacje`)
- Twarde usuwanie rekordów (z potwierdzeniem w UI)

## Model danych

Dane przechowywane są lokalnie w `data/db.json`:

- `groups`
- `plants(display_name, species, variety, original_label, category, group_id, row_num, col_num, notes, timestamps)`
- `products(name, product_type, default_dose, default_unit, notes, timestamps)`
- `treatments(target_type plant/group, plant_id, group_id, treatment_type, date, product_id, product_name_manual, dose, unit, reason, notes, timestamps)`
- `observations(plant_id, date, observation_type, title, description, timestamps)`

## Import arkusza CSV z roślinami

Importer jest dostępny w widoku **Rośliny** (`/rosliny`).

### Jak zaimportować Twój plik `Drzewa i krzewy - Arkusz1.csv`

1. Uruchom aplikację:

   ```bash
   npm install
   npm run dev
   ```

2. Otwórz `http://localhost:3000/rosliny`.
3. W sekcji **Import z arkusza CSV** kliknij **Importuj wybrany plik CSV** i wybierz swój wyeksportowany plik `Drzewa i krzewy - Arkusz1.csv`.
4. Po imporcie zobaczysz podsumowanie:
   - liczba przeskanowanych wierszy i komórek,
   - liczba nowych roślin,
   - liczba zaktualizowanych pozycji,
   - liczba pominiętych pustych komórek,
   - ostrzeżenia i błędy.

### Jak działa mapowanie arkusza

- plik jest interpretowany jako **siatka ogrodu**,
- numer wiersza w CSV = `row_num`,
- numer kolumny w CSV = `col_num`,
- każda niepusta komórka tworzy lub aktualizuje roślinę na mapie,
- całkowicie puste komórki i wiersze są pomijane,
- przy ponownym imporcie zajęte współrzędne są aktualizowane i raportowane w podsumowaniu.

Importer zachowuje oryginalny tekst komórki w polu `original_label`, tworzy przyjazny `display_name` oraz próbuje odgadnąć kategorię (`tree`, `shrub`, `vine`, `potted`, `unknown`) na podstawie nazwy.

### Przykład z repo

Do szybkiego sprawdzenia działania możesz:

- kliknąć przycisk **Załaduj przykład z repo** w `/rosliny`, albo
- pobrać plik `public/examples/przykladowy-arkusz-ogrodu.csv`.

Nie musisz ręcznie edytować żadnych plików projektu ani `data/db.json` — import zapisuje dane lokalnie sam.
