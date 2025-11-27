"use strict";
// ============================================================================
// 🗄️ DYNAMODB CLIENT - AWS SDK v3 Setup
// ============================================================================
// Diese Datei erstellt den DynamoDB Client für alle Datenbank-Operationen.
//
// 📌 WICHTIGE KONZEPTE FÜR ANFÄNGER:
//
// 1️⃣ DynamoDB = AWS NoSQL Datenbank
//    - Vollständig managed (kein Server-Management)
//    - Automatisches Scaling
//    - Pay-per-Request (nur für tatsächliche Zugriffe zahlen)
//    - Schema-less (keine festen Tabellen-Strukturen wie SQL)
//
// 2️⃣ AWS SDK v3 = Neues modulares AWS SDK
//    - Kleinere Bundle-Größe (nur importieren was man braucht)
//    - Bessere TypeScript-Unterstützung
//    - Modernes Promise-basiertes API
//
// 3️⃣ DynamoDB vs DynamoDBDocumentClient
//    - DynamoDBClient = Low-Level API (kompliziert)
//    - DynamoDBDocumentClient = High-Level API (einfacher!)
//    - DocumentClient wandelt automatisch JS-Objekte ↔ DynamoDB-Format
//
// 4️⃣ Credential-Handling (3 Szenarien)
//    a) Lambda (Produktion): Automatisch via IAM Role
//    b) Lokal mit AWS Profile: SSO Credentials
//    c) DynamoDB Local: Dummy Credentials für Entwicklung
//
// 5️⃣ Marshalling = Datenformat-Konvertierung
//    - JavaScript: {name: "Nike", price: 99.99}
//    - DynamoDB:   {name: {S: "Nike"}, price: {N: "99.99"}}
//    - DocumentClient macht dies automatisch!
//
// 💡 BEISPIEL:
//    // OHNE DocumentClient (kompliziert):
//    {id: {S: "abc-123"}, name: {S: "Nike"}, price: {N: "99.99"}}
//
//    // MIT DocumentClient (einfach):
//    {id: "abc-123", name: "Nike", price: 99.99}
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableNames = exports.dynamodb = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const credential_providers_1 = require("@aws-sdk/credential-providers");
// ============================================================================
// 📦 CLIENT KONFIGURATION
// ============================================================================
// Basis-Konfiguration für DynamoDB Client
const config = {
    // AWS Region (z.B. eu-north-1 = Stockholm)
    // Terraform setzt dies als Umgebungsvariable
    region: process.env.AWS_REGION || 'eu-north-1',
};
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SZENARIO 1: DynamoDB Local (Docker-Container für lokale Entwicklung)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (process.env.DYNAMODB_ENDPOINT) {
    // Custom Endpoint für lokales DynamoDB
    // Beispiel: http://localhost:8000
    config.endpoint = process.env.DYNAMODB_ENDPOINT;
    // Dummy Credentials für DynamoDB Local AND Tests
    // DynamoDB Local prüft keine echten Credentials
    // Tests need dummy credentials to avoid dynamic import errors
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        config.credentials = {
            accessKeyId: 'local',
            secretAccessKey: 'local',
        };
    }
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SZENARIO 2: Lokale Entwicklung mit AWS Profile (SSO)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
else if (process.env.AWS_PROFILE && !process.env.AWS_EXECUTION_ENV) {
    // Verwende AWS SSO Credentials aus lokalem Profile
    // Beispiel: AWS_PROFILE=cloudhelden npm run dev
    config.credentials = (0, credential_providers_1.fromSSO)({
        profile: process.env.AWS_PROFILE,
    });
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SZENARIO 3: Lambda (Produktion)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Wenn AWS_EXECUTION_ENV existiert (=Lambda-Umgebung):
// Credentials werden AUTOMATISCH via IAM Role bereitgestellt
// Keine manuelle Konfiguration nötig!
// Terraform setzt IAM Role: terraform/modules/lambda/iam.tf
// ============================================================================
// 🔧 DYNAMODB CLIENT ERSTELLEN
// ============================================================================
// Low-Level DynamoDB Client
const client = new client_dynamodb_1.DynamoDBClient(config);
// ============================================================================
// 📄 DOCUMENT CLIENT ERSTELLEN
// ============================================================================
// DocumentClient = High-Level Wrapper um Low-Level Client
// Macht DynamoDB-Operationen VIEL einfacher!
exports.dynamodb = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
    // Marshalling Options (JS-Objekte ↔ DynamoDB-Format)
    marshallOptions: {
        // undefined Werte aus Objekten entfernen
        // Beispiel: {name: "Nike", description: undefined} → {name: "Nike"}
        removeUndefinedValues: true,
        // Leere Strings NICHT in NULL konvertieren
        // Beispiel: {name: ""} bleibt {name: ""} und wird nicht {name: null}
        convertEmptyValues: false,
    },
});
// ============================================================================
// 📋 TABELLEN-NAMEN (als Konstanten)
// ============================================================================
// Zentrale Definition aller DynamoDB-Tabellen
// 💡 Verwendung: import { TableNames } from './client'
//                TableNames.PRODUCTS → 'ecokart-products'
exports.TableNames = {
    PRODUCTS: 'ecokart-products', // Produkt-Katalog (31 Sneakers)
    USERS: 'ecokart-users', // User-Accounts (Login-Daten)
    CARTS: 'ecokart-carts', // Warenkörbe (User-Shopping-Carts)
    ORDERS: 'ecokart-orders', // Bestellungen (Order-History)
};
// ============================================================================
// 📝 VERWENDUNG
// ============================================================================
//
// In anderen Dateien:
//   import { dynamodb, TableNames } from './client';
//
//   // PutItem (Speichern)
//   await dynamodb.send(new PutCommand({
//     TableName: TableNames.PRODUCTS,
//     Item: { id: "abc", name: "Nike", price: 99.99 }
//   }));
//
//   // GetItem (Lesen)
//   const result = await dynamodb.send(new GetCommand({
//     TableName: TableNames.PRODUCTS,
//     Key: { id: "abc" }
//   }));
//
// ============================================================================
