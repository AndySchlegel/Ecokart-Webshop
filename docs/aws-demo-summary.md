## EcoKart AWS Demo – Ausführliche Anleitung

Diese Anleitung beschreibt Schritt für Schritt, wie der Demo-Setup funktioniert. Wir starten ganz einfach und erklären jede Komponente so, dass du sie auch ohne tiefes Technik-Wissen nachvollziehen kannst.

### 1. Überblick: Was haben wir gebaut?
- **Produkt-Frontend**: Eine öffentliche Webseite (statisch auf S3), die alle Artikel zeigt.
- **Backend**: Eine AWS Lambda Funktion, die Artikel in einer DynamoDB-Tabelle speichert und wieder ausliest.
- **Admin-Frontend**: Eine kleine Next.js-Anwendung (läuft bei dir lokal), mit der du dich einloggst, Artikel anlegst und wieder löschen kannst.

### 2. Welche AWS-Ressourcen gibt es?
| Komponente | Zweck | Region | Hinweise |
|------------|-------|--------|---------|
| DynamoDB Tabelle `Articles` | Speichert alle Produkte (Felder: `id`, `name`, `price`, `description`, `imageUrl`) | `eu-central-1` | On-Demand Kapazität, keine Indizes nötig |
| Lambda Funktion `ecokart-demo-admin-20251016174733` | Nimmt HTTP-Anfragen entgegen (`GET`, `POST`, `DELETE`), spricht mit DynamoDB | `eu-central-1` | Function URL aktiviert, Auth via API-Key |
| Lambda Function URL | Öffentlicher Endpoint für Frontend und Admin-UI | `https://6lz2eswgrqw427gckz4txe4ghq0vgjem.lambda-url.eu-central-1.on.aws/` | Erwartet bei `POST`/`DELETE` den Header `x-api-key: demo-admin-key-2025` |
| IAM Rolle `ecokart-demo-lambda-role` | Berechtigung für DynamoDB + CloudWatch Logs | `eu-central-1` | Policy enthält `PutItem`, `Scan`, `DeleteItem` |
| S3 Bucket `ecokart-demo-frontend-20251016174733` | Hostet das statische Shop-Frontend | `eu-central-1` | Static Website Hosting aktiv, Public Access erlaubt |
| Website URL | Zugriffspunkt für Besucher | `http://ecokart-demo-frontend-20251016174733.s3-website.eu-central-1.amazonaws.com` | Falls HTTPS benötigt wird, kann man CloudFront vorschalten |

### 3. Lokale Projekte
- `frontend/` → Shop-Webseite (Next.js Static Export). Artefakte liegen in `frontend/out/` und werden nach S3 synchronisiert.
- `admin-backend/` → Lambda-Quellcode. `npm install` + `zip` (siehe README) → `lambda.zip` → via `aws lambda update-function-code` bereitstellen.
- `admin-frontend/` → Admin-UI (Next.js App Router). Läuft lokal mit Demo-Zugangsdaten.

### 4. So startest du die Admin-Oberfläche
1. Ins Projekt gehen: `cd admin-frontend`
2. Pakete installieren (falls noch nicht): `npm install`
3. `.env.local` ist bereits mit Demo-Werten gefüllt:
   ```
   ADMIN_APP_USERNAME=admin@example.com
   ADMIN_APP_PASSWORD=DemoPass123
   ADMIN_SESSION_SECRET=demo-session-secret-please-change
   ADMIN_API_URL=https://6lz2eswgrqw427gckz4txe4ghq0vgjem.lambda-url.eu-central-1.on.aws/
   ADMIN_API_KEY=demo-admin-key-2025
   ```
4. Lokalen Server starten: `npm run dev -- --port 3001`
5. Browser öffnen: `http://localhost:3001/login`
6. Einloggen mit `admin@example.com` / `DemoPass123`
7. Dashboard: 
   - Tabelle zeigt alle aktuellen Artikel
   - Formular fügt neue Artikel hinzu
   - „Entfernen“-Button löscht den ausgewählten Artikel (doppelte Nachfrage, damit nichts versehentlich weg ist)
8. Änderungen erscheinen sofort im Shop-Frontend (ggf. Browser-Cache/Hard-Reload benutzen: `Ctrl/Cmd + Shift + R`).

### 5. So deployst du den Shop neu auf S3
```bash
cd frontend
npm run build
aws s3 sync out/ s3://ecokart-demo-frontend-20251016174733 --delete
```
- Dabei werden alle statischen Dateien aktualisiert.
- Bilder werden von externen URLs geladen (`object-fit: cover` sorgt für saubere Anzeige).

### 6. Lambda aktualisieren (z. B. bei Code-Änderungen)
```bash
cd admin-backend
npm install          # (nur wenn sich Abhängigkeiten geändert haben)
npm prune --omit=dev
rm -f lambda.zip
zip -r lambda.zip src node_modules package.json package-lock.json
aws lambda update-function-code \
  --function-name ecokart-demo-admin-20251016174733 \
  --zip-file fileb://lambda.zip \
  --region eu-central-1
```

### 7. DynamoDB Einträge manuell prüfen oder löschen
- Anzeigen (alle Artikel):
  ```bash
  curl https://6lz2eswgrqw427gckz4txe4ghq0vgjem.lambda-url.eu-central-1.on.aws/
  ```
- Neuen Artikel anlegen:
  ```bash
  curl -X POST https://6lz2eswgrqw427gckz4txe4ghq0vgjem.lambda-url.eu-central-1.on.aws/ \
    -H 'Content-Type: application/json' \
    -H 'x-api-key: demo-admin-key-2025' \
    -d '{
      "name":"Demo",
      "price":9.99,
      "description":"Testartikel",
      "imageUrl":"https://example.com/img.jpg"
    }'
  ```
- Artikel löschen (via CLI):
  ```bash
  curl -X DELETE https://6lz2eswgrqw427gckz4txe4ghq0vgjem.lambda-url.eu-central-1.on.aws/ \
    -H 'Content-Type: application/json' \
    -H 'x-api-key: demo-admin-key-2025' \
    -d '{"id":"<ARTIKEL-ID>"}'
  ```

### 8. Häufige Fehler & Lösungen
| Problem | Grund | Lösung |
|---------|-------|--------|
| `Access-Control-Allow-Origin cannot contain more than one origin` | Sowohl Lambda-Code als auch Function URL liefern CORS-Header | Nur die Function URL lässt die CORS-Header senden (bereits umgesetzt) |
| `Response constructor: Invalid response status code 204` | JSON-Body mit Status 204 in Next.js API Route | API-Route liefert jetzt `new NextResponse(null, { status: 204 })` |
| Löschen schlägt mit 500 fehl | Lambda-Rolle hatte keine `dynamodb:DeleteItem`-Berechtigung | Inline-Policy erweitert (Put, Scan, Delete) |
| Keine Lambda-Logs sichtbar | Log-Group fehlte | `/aws/lambda/ecokart-demo-admin-20251016174733` per CLI angelegt |

### 9. Aufräumen (wenn Demo beendet wird)
In AWS bitte löschen:
1. Lambda Funktion `ecokart-demo-admin-20251016174733`
2. DynamoDB Tabelle `Articles`
3. S3 Bucket `ecokart-demo-frontend-20251016174733`
4. IAM Rolle `ecokart-demo-lambda-role`
5. Optional: CloudWatch Log Group

### 10. Nächste Schritte
- Wenn du das Admin-Frontend online hosten möchtest (z. B. über Amplify), werden noch IAM-Rechte benötigt (CreateApp war durch eure SCP blockiert). Sobald die Freigabe da ist, können wir den Deploy dort automatisieren.
- Für HTTPS auf der Shop-Seite kann man eine CloudFront-Distribution aufsetzen.
- Optional lässt sich eine Nutzerverwaltung mit Cognito anbinden (derzeit durch SCP-Sperre nicht möglich).

Viel Spaß mit dem Demo-Setup! Bei Fragen einfach melden – wir können jeden Schritt vertiefen oder erweitern.
