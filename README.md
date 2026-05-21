# Ogród MVP (Next.js + TypeScript + Tailwind CSS)

MVP aplikacji webowej do zarządzania ogrodem:
- bez logowania (v1)
- ręczne wprowadzanie danych
- mapa 24x120
- jedna komórka = jedna roślina
- pełne twarde usuwanie rekordów
- interfejs po polsku

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- LocalStorage jako warstwa danych (lokalna, bez konfiguracji)

## Funkcjonalności v1
- Dashboard (`/`)
- Mapa (`/mapa`) – scrollowalna siatka 24x120, nazwy roślin w komórkach
- Rośliny (`/rosliny`) + dodawanie/edycja/usuwanie
- Szczegóły rośliny (`/rosliny/[id]`)
- Grupy (`/grupy`) + szczegóły grupy (`/grupy/[id]`)
- Zabiegi (`/zabiegi`) + dodawanie/edycja (`/zabiegi/nowy`, `/zabiegi/[id]/edytuj`)
- Produkty (`/produkty`) CRUD
- Obserwacje (`/obserwacje`) z typami: choroba/szkodnik/notatka

## Model danych
Warstwa danych jest zaimplementowana w: `src/lib/garden.ts`.

Encje:
- `groups`
- `plants`
- `products`
- `treatments`
- `observations`

Walidacje:
- unikalność zajętości komórki mapy (`row_num`, `col_num`),
- zabieg dla pojedynczej rośliny lub grupy,
- produkt z listy lub nazwa ręczna.

## Uruchomienie lokalne
```bash
npm install
npm run dev
```
Aplikacja domyślnie działa pod: `http://localhost:3000`

## Build i lint
```bash
npm run lint
npm run build
```

## Uwagi dot. trwałości danych
- Dane są zapisywane lokalnie w przeglądarce (`localStorage`, klucz: `garden-mvp-db-v1`).
- To świadomy wybór MVP „local-friendly”.
- Integrację z Supabase można dodać przez podmianę funkcji `loadDb/saveDb` na adapter API/DB (model danych jest już ustrukturyzowany pod relacyjne tabele).

## Wdrożenie
Najprościej: Vercel.
1. Podłącz repozytorium.
2. Framework: Next.js (auto-detect).
3. Deploy bez dodatkowych zmiennych środowiskowych (dla localStorage).
