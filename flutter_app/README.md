# CA7 Flutter app

The CA7 front end in Flutter (web, Android, iOS). It is a migration of the Next.js site, not a redesign: same colors, fonts
(Geist), layout, texts, languages and the same backend. See [`docs/FLUTTER_MIGRATION.md`](../docs/FLUTTER_MIGRATION.md) for what is
done and what is not.

## Run

```bash
cd flutter_app
flutter pub get
flutter run -d chrome --dart-define=CA7_API=http://localhost:3000     # the CA7 backend (pnpm dev)
```

The backend must allow the app's address: set `CA7_APP_ORIGINS=http://localhost:8080` (comma separated) in the backend `.env`.
Build for the web: `flutter build web --release --no-web-resources-cdn --dart-define=CA7_API=https://cloud.ca7.io`
(serve `build/web` with a fallback to `index.html`, for example `try_files $uri /index.html`).

## Structure

```
lib/
  app/            app.dart, router.dart (go_router, /{lang}/page like the website), theme/, configuration/, shell/ (header, footer, menu)
  core/           api/ (one ApiClient), auth/, i18n/, storage/ (secure token), errors/, widgets/ (atoms, DotIcon, responsive), providers.dart
  features/       home, pricing, auth, chat, catalog (models, datasets), dashboard, content
assets/           icons, brand, payments, fonts (Geist), i18n/*.json, data/ (camera dots, legal texts)
tool_export_translations.mjs   exports src/i18n/translations/*.ts to assets/i18n/*.json
tool_export_pages.mjs          exports the legal page texts to assets/data/pages.json
```

State: Riverpod. Navigation: go_router. API: Payload REST (`/api/<collection>`, `/api/users/*`) and `/api/ca/*` with
`Authorization: JWT <token>`; the token is kept in secure storage.

## Tests

```bash
flutter analyze && flutter test
```
