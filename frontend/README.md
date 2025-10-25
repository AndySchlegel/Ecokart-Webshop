## Frontend Demo Setup

Kurzanleitung für das statische Next.js-Frontend der AWS-Demo.

### Lokale Entwicklung

```bash
npm install
npm run dev
```

### Produktion & Upload

```bash
npm run build
# out/ enthält den statischen Export
aws s3 sync out/ s3://ecokart-demo-frontend-20251016174733 --delete
```

Das erzeugte Verzeichnis `out/` kann direkt in den S3-Bucket für die Demo kopiert werden.

### Konfiguration

- `.env.local` auf Basis von `.env.example` anlegen.
- `NEXT_PUBLIC_API_URL` auf die Lambda Function URL zeigen lassen (aktuell `https://6lz2eswgrqw427gckz4txe4ghq0vgjem.lambda-url.eu-central-1.on.aws/`).
