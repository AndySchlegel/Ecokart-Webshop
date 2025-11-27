"use strict";
// ============================================================================
// 🔌 AWS LAMBDA HANDLER - Express.js → Lambda Adapter
// ============================================================================
// Diese Datei ist der "Adapter" zwischen Express.js und AWS Lambda.
//
// 📌 WICHTIGE KONZEPTE FÜR ANFÄNGER:
//
// 1️⃣ AWS Lambda = Serverless Compute Service
//    - Lambda führt Code aus OHNE dass du Server verwalten musst
//    - Lambda startet/stoppt automatisch basierend auf Requests
//    - Du zahlst nur für tatsächliche Ausführungszeit (Pay-per-Use)
//
// 2️⃣ Das Problem
//    - Express.js erwartet einen "normalen" HTTP-Server
//    - Lambda verwendet ein eigenes Event-Format (API Gateway Events)
//    - Wir brauchen einen Adapter der zwischen beiden übersetzt
//
// 3️⃣ Die Lösung: serverless-http
//    - NPM Package das Express.js für Lambda wrappet
//    - Wandelt Lambda Events → Express Requests
//    - Wandelt Express Responses → Lambda Responses
//
// 4️⃣ Request-Flow
//    API Gateway → Lambda Event → serverless-http → Express → unsere Routes
//
// 5️⃣ Binary Content
//    - Normalerweise behandelt Lambda alles als Text
//    - Wir definieren dass Bilder als Binary behandelt werden sollen
//    - Wichtig für: Produkt-Bilder, File-Uploads, etc.
//
// 💡 BEISPIEL:
//    User macht Request: GET https://xxx.execute-api.eu-north-1.amazonaws.com/Prod/api/products
//    ↓
//    API Gateway wandelt um in Lambda Event
//    ↓
//    Lambda führt diese Datei aus (handler)
//    ↓
//    serverless-http übersetzt Event → Express Request
//    ↓
//    Express verarbeitet Request (siehe index.ts)
//    ↓
//    Express sendet Response zurück
//    ↓
//    serverless-http übersetzt Express Response → Lambda Response
//    ↓
//    API Gateway sendet Response an User
// ============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const serverless_http_1 = __importDefault(require("serverless-http"));
const index_1 = __importDefault(require("./index"));
// ============================================================================
// 🎯 LAMBDA HANDLER EXPORT
// ============================================================================
// Wrap Express App für Lambda
// 💡 serverless() erstellt eine Lambda-kompatible Handler-Funktion
// 💡 Diese Funktion ist der Einstiegspunkt für jeden Lambda-Request
exports.handler = (0, serverless_http_1.default)(index_1.default, {
    // Binary Content Types
    // 💡 Definiert welche Content-Types als Binary behandelt werden
    // 💡 Wichtig für Bild-Uploads und andere nicht-Text-Daten
    binary: [
        'image/*', // Alle Bild-Formate (image/png, image/jpeg, etc.)
        'application/octet-stream' // Allgemeines Binary-Format
    ],
});
// ============================================================================
// 📝 TERRAFORM INTEGRATION
// ============================================================================
//
// Diese handler-Funktion wird von Terraform referenziert:
// terraform/modules/lambda/main.tf:
//   handler = "lambda.handler"
//              ↑       ↑
//              |       └─ Funktion: handler
//              └───────── Datei: lambda.ts (kompiliert zu lambda.js)
//
// Lambda führt bei jedem Request aus: require('./lambda').handler(event, context)
// ============================================================================
