# TravelPlan

Application mobile de pilotage budgétaire pour voyageurs longue durée (tour du monde), construite avec React + TypeScript + Tauri v2, orientée offline-first avec SQLite embarqué.

## Stack

- Frontend: React 19 + TypeScript + Vite
- App shell: Tauri v2
- Base locale: SQLite via @tauri-apps/plugin-sql
- UI: thème OLED noir, glassmorphism, animations fluides
- i18n V1: fr-FR + en-US

## Fonctionnalités V1 incluses

- Setup voyage: @ID (minimum 8), budget global, pays, dates, voyageurs en groupe
- Home:
  - Quick Add (montant + devise)
  - Smart Form pré-rempli avec géolocalisation
  - TicketScan OCR (mock provider) avec logique de correction montant/devise
  - Hub des pays avec budget, historique, conseils pays
- Stats: budget restant, rythme journalier, jauges catégorie
- Prévision: dépenses futures et impact budgétaire
- Rewind: historique chronologique + fiabilité prévision/réel
- Border Pop-up: transition pays détectée avec options extension/modification
- AI Travel Planner:
  - chat contextuel avec localisation injectée
  - connexion API key utilisateur (OpenAI, Mistral, Claude)
  - contexte budgétaire local injecté type function-calling
- Sync V1 Discord: export JSON vers webhook via interface de provider

## Architecture

```text
src/
  api/          # Appels externes (LLM, conseils pays)
  components/   # UI réutilisable (cards, tabs, vues, sheets)
  core/         # Contexte global, ports, selectors
  data/         # Gateways SQLite/localStorage, migrations
  i18n/         # Traductions fr/en et provider
  models/       # Modèles TypeScript de domaine
  services/     # AI planner, OCR, geolocation, sync Discord
  utils/        # Helpers dates, IDs, devises, géolocalisation
```

Les intégrations externes sont encapsulées via des interfaces (ports) pour faciliter les migrations V2 (ex: SyncProvider Drive/Dropbox).

## Démarrage

Pré-requis:

- Node.js 20+
- Rust toolchain
- Pour iOS: Xcode + targets Apple

Installation:

```bash
npm install
```

Développement web:

```bash
npm run dev
```

Développement Tauri desktop:

```bash
npm run tauri dev
```

Build frontend:

```bash
npm run build
```

## Build iOS .ipa non signé (GitHub Actions)

Le workflow [.github/workflows/ios-unsigned-ipa.yml](.github/workflows/ios-unsigned-ipa.yml) génère une archive .ipa non signée pour usage SideStore/AltStore.

Pipeline:

1. Initialisation iOS Tauri
2. Build sans signature
3. Packaging manuel en Payload/*.app -> TravelPlan-unsigned.ipa
4. Upload en artifact GitHub Actions

## Notes importantes

- L'OCR est implémenté via provider mock pour la V1. Remplacer par un provider réel dans services/ticketscan.
- Les conseils pays sont fournis via fallback local en V1. Brancher API/scraping réel dans api/TourDuMondisteAdviceApi.
- Les clés LLM sont saisies côté client par l'utilisateur final. Prévoir un chiffrement local si nécessaire en V2.
