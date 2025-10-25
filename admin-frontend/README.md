## Admin Frontend

Ein minimalistisches Next.js-Frontend zum Verwalten der Artikel im Demo-Backend.

### Setup

```bash
cd admin-frontend
npm install
cp .env.example .env.local
```

`ADMIN_APP_USERNAME`, `ADMIN_APP_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_API_URL` und `ADMIN_API_KEY` anpassen.

### Entwicklung

```bash
npm run dev
```

Danach unter `http://localhost:3001` (Port kann je nach Umgebung variieren) anmelden.

### Produktion

```bash
npm run build
npm start
```

Die App erwartet eine HTTPS-Umgebung, damit das Auth-Cookie sicher gesetzt werden kann. Für einen Serverless-Deploy (z. B. Vercel) genügt das Ersetzen der Umgebungsvariablen. 
