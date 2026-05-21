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
- Mapa ogrodu 24x120 (`/mapa`) z nazwą rośliny tylko w zajętych komórkach i ręcznym przeciąganiem na puste pola
- CRUD roślin (`/rosliny`)
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

## Przesuwanie roślin na mapie

- Wejdź na `/mapa`.
- Przeciągnij nazwę rośliny na puste pole.
- Zajęte pole blokuje ruch i pokaże komunikat po polsku.
- Jeśli nie korzystasz z myszy, pozycję nadal możesz zmienić w formularzu edycji rośliny.

## Nazewnictwo grup

- Dla uproszczonych grup krzewów używaj etykiety `Krzewy`.
