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

## Tryb podglądu (read-only)

Aplikacja obsługuje zmienną środowiskową:

- `NEXT_PUBLIC_READ_ONLY_MODE=true`

Gdy jest ustawiona na `true`, aplikacja działa wyłącznie w trybie podglądu:

- brak dodawania, edycji i usuwania danych,
- brak importu CSV/Google Sheets z UI,
- brak drag & drop i usuwania roślin z mapy,
- akcje modyfikujące są ukryte w interfejsie,
- dodatkowo server actions blokują zapis po stronie serwera.

W UI wyświetlany jest komunikat:

- `Tryb podglądu — edycja jest wyłączona`

Gdy zmienna jest nieustawiona albo ma wartość inną niż `true`, tryb edycji działa normalnie.

## Wdrożenie na Vercel

1. Wejdź na Vercel i wybierz **Add New Project**.
2. Zaimportuj repozytorium `kefirm/copilot` z GitHub.
3. W ustawieniach projektu dodaj zmienną środowiskową:
   - `NEXT_PUBLIC_READ_ONLY_MODE=true`
4. Uruchom deploy.

## Najważniejsze funkcje MVP

- Dashboard (`/`)
- Mapa ogrodu 20x200 (`/mapa`)
- Lista roślin z filtrowaniem i sortowaniem (`/rosliny`)
- Import CSV / Google Sheets (`/rosliny`) i auto-przypisanie grup
- Zarządzanie grupami (`/grupy`)
- Zarządzanie produktami (`/produkty`)
- Zarządzanie zabiegami (`/zabiegi`) z filtrowaniem/sortowaniem
- Zarządzanie obserwacjami (`/obserwacje`)

## Model danych

Dane przechowywane są lokalnie w `data/db.json`:

- `groups`
- `plants(display_name, species, variety, original_label, category, group_id, row_num, col_num, notes, timestamps)`
- `products(name, product_type, default_dose, default_unit, notes, timestamps)`
- `treatments(target_type plant/group, plant_id, group_id, treatment_type, date, product_id, product_name_manual, dose, unit, reason, notes, timestamps)`
- `observations(plant_id, date, observation_type, title, description, timestamps)`
