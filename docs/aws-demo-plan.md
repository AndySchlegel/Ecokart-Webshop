## Überblick
Kurzer Ablaufplan für die AWS-Demo mit statischem Shop-Frontend, leichtgewichtigem Admin-Backend und DynamoDB-Datenhaltung.

## 1. Zielbild schärfen
1. Frontend zeigt fünf Demoartikel (drei hart codiert, zwei werden live ergänzt).
2. Admin-Team pflegt Artikel über `POST /articles` mit API-Key-Auth.
3. Daten werden in DynamoDB gespeichert; Region `eu-central-1`.
4. Keine Terraform-Automatisierung, alle Ressourcen manuell im AWS Management Console oder via CLI.

## 2. Architekturbausteine
1. **Frontend**: React/Next.js Static Export, Hosting auf S3 Static Website, optional CloudFront davor.
2. **Backend**: AWS Lambda (Node.js 18) hinter API Gateway. Endpunkte `GET /articles` und `POST /articles`.
3. **Datenbank**: DynamoDB-Tabelle `Articles` mit Partition-Key `id` (String, UUID).
4. **Auth & IAM**: API Gateway API-Key, Usage Plan, Lambda Execution Role mit `dynamodb:Scan` und `dynamodb:PutItem`.
5. **Observability**: CloudWatch Logs für Lambda, optional X-Ray Sampling aktivieren.

## 3. Repo-Struktur & lokale Vorbereitung
1. Verzeichnisse anlegen: `frontend/`, `admin-backend/`, `docs/`.
2. `.env.example` pflegen mit `NEXT_PUBLIC_API_URL` und `ADMIN_API_KEY`.
3. Postman-Collection für Demo-Calls vorbereiten.
4. README in jedem Teilprojekt mit Build- und Deploy-Schritten (npm-Befehle + Upload-Hinweise).

## 4. Manuelle AWS-Konfiguration
1. **DynamoDB**: Tabelle `Articles`, Kapazität auf On-Demand, Attribute `id (S)`, optional `slug (S)`.
2. **Lambda**: ZIP-Upload mit Node-Handler `index.handler`, Umgebungsvariable `TABLE_NAME=Articles`.
3. **API Gateway**: REST API, Ressource `/articles`, Methoden `GET`/`POST`, Lambda-Proxy-Integration, Stage `demo`.
4. **API Key**: Usage Plan erstellen, Schlüssel dem Stage zuordnen, Key für Demo notieren.
5. **S3**: Bucket `ecokart-demo-frontend`, Static Website Hosting aktivieren, `index.html` + `error.html` hochladen.
6. **CloudFront (optional)**: Distribution über S3-Bucket, Default Cache Behavior mit GET/HEAD zulassen.

## 5. Deploy- und Testschritte
1. Frontend bauen: 
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. `frontend/out/`-Inhalte in S3-Bucket hochladen (CLI oder Console).
3. Backend paketieren:
   ```bash
   cd admin-backend
   npm install --production
   zip -r lambda.zip .
   ```
4. Lambda aufrufen, Smoke-Test über API Gateway testen (`GET /articles`).
5. Postman-Flow: Zwei neue Artikel per `POST /articles` anlegen, `x-api-key` Header setzen.
6. Frontend neu laden und prüfen, dass neue Artikel erscheinen.

## 6. Demo- und Aufräumplan
1. Demo-Skript schreiben: Architekturfolie → Frontend zeigen → Postman-Call → DynamoDB-Eintrag → Frontend-Refresh.
2. Screenshots/Screenrec ordnen, Kosten- und Regionsangaben ergänzen.
3. Rückbau: CloudFront (falls vorhanden), S3-Bucket leeren/löschen, API Gateway REST API, Lambda, DynamoDB-Tabelle entfernen.

## 7. Aktueller Deploy-Stand (16.10.2025)
1. DynamoDB: Tabelle `Articles` in `eu-central-1`, On-Demand, erster Datensatz über CLI angelegt.
2. Lambda: Funktion `ecokart-demo-admin-20251016174733`, Function URL `https://6lz2eswgrqw427gckz4txe4ghq0vgjem.lambda-url.eu-central-1.on.aws/`, Umgebungsvariablen `TABLE_NAME=Articles`, `ADMIN_API_KEY=demo-admin-key-2025`.
3. Auth: API Gateway war durch Service Control Policy blockiert, stattdessen prüft die Lambda-Funktion den Header `x-api-key` selbst.
4. S3 Frontend: Bucket `ecokart-demo-frontend-20251016174733`, Website-Endpunkt `http://ecokart-demo-frontend-20251016174733.s3-website.eu-central-1.amazonaws.com`.
5. Build-Artefakte: `frontend/out/` mit `npm run build` erzeugt und via `aws s3 sync` hochgeladen.
6. Testaufrufe: `GET` ohne Key liefert Produktliste, `POST` mit `x-api-key: demo-admin-key-2025` erzeugt neue Einträge (siehe `fa562aab-670d-494d-aef2-89b5d96e5f0e`).

## 8. Admin-Frontend (lokal)
1. Projekt `admin-frontend/` anlegen, `.env.local` auf Basis der Vorlage füllen (`ADMIN_APP_USERNAME`, `ADMIN_APP_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_API_URL`, `ADMIN_API_KEY`).
2. Start lokal: 
   ```bash
   cd admin-frontend
   npm install
   npm run dev -- --port 3001
   ```
3. Login mit den in `.env.local` gesetzten Werten. Nach erfolgreicher Anmeldung steht ein Dashboard mit Artikel-Liste, Formular (POST → Lambda) und Entfernen-Schaltfläche (DELETE → Lambda) bereit.
4. Logout/Home werden über HTTP-only-Cookies geregelt; für Produktion `npm run build && npm start` verwenden (HTTPS beachten).
