## Admin Backend Lambda

Kurze Anleitung für das Demo-Backend, das Artikel in DynamoDB verwaltet.

### Vorbereitung

```bash
npm install
npm run lint
```

### Lambda-Paket schnüren

```bash
zip -r lambda.zip src package.json package-lock.json node_modules
```

Vor dem Zippen `npm install --production` ausführen, damit nur Laufzeit-Abhängigkeiten enthalten sind.

### Umgebungsvariablen

- `TABLE_NAME`: Name der DynamoDB-Tabelle (Standard: `Articles`).
- `ADMIN_API_KEY`: Schlüssel, der von Clients im Header `x-api-key` mitgeschickt werden muss (POST).
