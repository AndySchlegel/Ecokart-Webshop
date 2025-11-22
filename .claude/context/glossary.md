# 📖 EN/DE Technical Glossary - Ecokart

**Version:** 1.0
**Created:** 22. November 2025
**Purpose:** Zweisprachiges Glossar aller Fachbegriffe für English Learning
**Status:** Living Document - wird kontinuierlich erweitert

---

## 🎯 Wie nutzen?

- **Alphabetisch sortiert** (EN → DE)
- **Mit Kontext-Beispiel** aus Ecokart
- **Beim ersten Vorkommen** in Session: Begriff hier nachschlagen
- **Neue Begriffe** sofort hinzufügen

---

## A

### **API Gateway**
**Deutsch:** API-Zugangspunkt, Schnittstellen-Gateway
**Definition:** AWS Service der HTTP-Requests zu Backend-Services routet
**Ecokart Context:**
- Wir nutzen REST API Gateway (nicht HTTP API)
- Routes `/api/products` → Lambda Function
- CORS muss aktiviert sein

**Beispiel:**
```
API Gateway empfängt Request:
GET https://xxx.execute-api.eu-north-1.amazonaws.com/dev/api/products
→ Routet zu Lambda Function "ecokart-development-api"
```

---

### **Authentication**
**Deutsch:** Authentifizierung, Benutzeranmeldung
**Definition:** Prozess der Identitäts-Überprüfung eines Users
**Ecokart Context:**
- Aktuell: Custom JWT Authentication
- Zukünftig: AWS Cognito (blocked by SCP)
- Two-Layer: Basic Auth (Amplify) + JWT (Backend)

---

### **Authorization**
**Deutsch:** Autorisierung, Zugriffsberechtigung
**Definition:** Prüfung ob authentifizierter User eine Aktion ausführen darf
**Unterschied zu Authentication:**
- Authentication = Wer bist du? (Login)
- Authorization = Was darfst du? (Permissions)

**Ecokart Context:**
```
Authentication: User logged in as "andy@ecokart.com"
Authorization: User role "customer" → darf Cart nutzen, nicht Admin-Panel
```

---

### **Availability**
**Deutsch:** Verfügbarkeit
**Definition:** Wie oft/zuverlässig ein System erreichbar ist
**Ecokart Context:**
- Target: 99.9% Uptime
- DynamoDB: 99.99% SLA von AWS
- Amplify: Auto-Healing bei Failures

---

## B

### **Backend**
**Deutsch:** Backend, Server-Seite
**Definition:** Server-seitige Logik, APIs, Datenbank-Zugriffe
**Ecokart Context:**
- Express.js auf AWS Lambda
- Serverless (kein dauerhaft laufender Server)
- Auto-Scaling bei Traffic

---

### **Basic Auth**
**Deutsch:** Basis-Authentifizierung
**Definition:** Einfacher Username/Password Schutz auf HTTP-Ebene
**Ecokart Context:**
- Layer 1 Protection auf Amplify
- Development: demo / test1234
- Production: Sollte deaktiviert werden

---

### **Branch**
**Deutsch:** Zweig (Git)
**Definition:** Parallele Entwicklungs-Linie in Git
**Ecokart Context:**
```
main (Branch) → Production Environment
staging      → Staging Environment
develop      → Development Environment
```

---

### **Build**
**Deutsch:** Erstellung, Kompilierung
**Definition:** Prozess der Code-Umwandlung in ausführbare Form
**Ecokart Context:**
- Frontend: `npm run build` → Next.js Production Build
- Backend: TypeScript → JavaScript Compilation
- Amplify: Auto-Build bei jedem Push

---

## C

### **Cache**
**Deutsch:** Zwischenspeicher
**Definition:** Temporärer Speicher für häufig genutzte Daten
**Ecokart Context:**
- Browser Cache für Static Assets
- DynamoDB Caching (DAX - nicht aktiviert)
- Amplify CDN Cache

---

### **CI/CD**
**Deutsch:** Kontinuierliche Integration/Bereitstellung
**Full:** Continuous Integration / Continuous Deployment
**Definition:** Automatisierter Prozess von Code → Production
**Ecokart Context:**
```
Push to develop
→ GitHub Actions Workflow
→ Terraform Deploy
→ Infrastructure on AWS
```

---

### **Circuit Breaker**
**Deutsch:** Unterbrechungsmechanismus, Sicherungsschalter
**Definition:** Stoppt Operationen nach N Fehlversuchen
**Ecokart Context:**
- Nach 3 fehlgeschlagenen Terraform Applies → STOP
- Verhindert endlose Retry-Loops
- User entscheidet über nächsten Schritt

**Beispiel:**
```
Versuch 1: terraform apply → Error
Versuch 2: terraform apply → Error
Versuch 3: terraform apply → Error
→ Circuit Breaker: STOP! User informieren.
```

---

### **Commit**
**Deutsch:** Festschreiben, Versionierung
**Definition:** Änderungen in Git-History speichern
**Ecokart Context:**
- Commit Messages auf Englisch
- Format: "fix: Description" oder "feat: Description"
- Co-Authored-By: Claude hinzufügen

---

### **CORS**
**Deutsch:** Cross-Origin Resource Sharing, Ursprungsübergreifende Ressourcen-Freigabe
**Full:** Cross-Origin Resource Sharing
**Definition:** Browser-Security-Mechanismus für API-Zugriffe
**Ecokart Context:**
- API Gateway muss CORS aktiviert haben
- Erlaubt Frontend (amplify.com) → Backend (execute-api.com)
- Headers: Access-Control-Allow-Origin

---

## D

### **Deployment**
**Deutsch:** Bereitstellung, Veröffentlichung
**Definition:** Prozess der Code-Veröffentlichung zu Production
**Ecokart Context:**
- Automated via GitHub Actions
- Terraform Apply deployed Infrastructure
- Zero-Downtime Deploy

---

### **Destroy**
**Deutsch:** Zerstörung, Löschung
**Definition:** Komplette Löschung der Infrastructure
**Ecokart Context:**
```
terraform destroy
→ Löscht alle AWS Resources
→ Spart Kosten bei Nicht-Nutzung
```

---

### **DynamoDB**
**Deutsch:** DynamoDB (AWS NoSQL Datenbank)
**Definition:** Vollständig verwaltete NoSQL Datenbank von AWS
**Ecokart Context:**
- 4 Tables: products, users, carts, orders
- PAY_PER_REQUEST Mode (Development)
- Key-Value Store (nicht relational)

---

## E

### **Environment**
**Deutsch:** Umgebung
**Definition:** Isolierte Instanz des Systems
**Ecokart Context:**
```
Development → Zum Testen (klein & günstig)
Staging     → Pre-Production Test
Production  → Live für Kunden
```

---

### **Error Handling**
**Deutsch:** Fehlerbehandlung
**Definition:** Wie System auf Fehler reagiert
**Ecokart Context:**
- 5-Schritte-Protokoll: STOP → LOG → ANALYZE → PRESENT → DOCUMENT
- Frühe Eskalation (nach 1-2 Versuchen)

---

## F

### **Frontend**
**Deutsch:** Frontend, Benutzeroberfläche
**Definition:** Client-seitige UI die User sieht
**Ecokart Context:**
- Next.js 15 mit SSR (Server-Side Rendering)
- Hosted auf AWS Amplify
- Responsive Design (Mobile + Desktop)

---

## G

### **Git**
**Deutsch:** Git (Versionskontroll-System)
**Definition:** System zur Code-Versionierung
**Ecokart Context:**
- GitHub als Remote Repository
- Branching Strategy: develop → staging → main

---

## I

### **Infrastructure**
**Deutsch:** Infrastruktur
**Definition:** Server, Datenbanken, Netzwerk (Cloud-Ressourcen)
**Ecokart Context:**
- 100% AWS (Lambda, DynamoDB, API Gateway, Amplify)
- Managed via Terraform (IaC)
- Serverless Architecture

---

### **Infrastructure as Code (IaC)**
**Deutsch:** Infrastruktur als Code
**Definition:** Infrastructure via Code-Files statt Klick-Konfiguration
**Ecokart Context:**
- Terraform HCL (HashiCorp Configuration Language)
- Wiederholbar, versioniert, dokumentiert

---

## J

### **JWT**
**Deutsch:** JSON Web Token
**Full:** JSON Web Token
**Definition:** Selbst-enthaltenes Token für Authentication
**Ecokart Context:**
```
User logged in → Backend generiert JWT
Frontend speichert Token in localStorage
Jeder Request: Authorization: Bearer <JWT>
```

---

## L

### **Lambda**
**Deutsch:** Lambda (AWS Serverless Function)
**Definition:** Code läuft nur bei Bedarf, ohne dauerhaften Server
**Ecokart Context:**
- Backend Express.js läuft auf Lambda
- Pay-per-Use (nur bei Request)
- Auto-Scaling

---

### **Logging**
**Deutsch:** Protokollierung
**Definition:** Aufzeichnung von System-Events für Debugging
**Ecokart Context:**
- CloudWatch Logs für Lambda
- Amplify Build Logs
- API Gateway Access Logs (disabled in Dev)

---

## M

### **Migration**
**Deutsch:** Migration, Datenmigration
**Definition:** Daten von einem System zu anderem übertragen
**Ecokart Context:**
- migrate-to-dynamodb.js → Seeds Database
- BEIDE Scripts updaten (nicht nur eins!)

---

### **Monitoring**
**Deutsch:** Überwachung
**Definition:** Kontinuierliche Beobachtung des System-Zustands
**Ecokart Context:**
- CloudWatch Logs
- AWS Cost Monitoring
- Uptime Checks (geplant)

---

## N

### **Nuclear Cleanup**
**Deutsch:** Notfall-Bereinigung
**Definition:** Komplette Löschung via AWS CLI (nicht Terraform)
**Ecokart Context:**
- Workflow: .github/workflows/nuclear-cleanup.yml
- Wann: Terraform Destroy scheitert
- Requires: Typing "NUCLEAR" to confirm

---

## O

### **OIDC**
**Deutsch:** OpenID Connect
**Full:** OpenID Connect
**Definition:** Authentifizierungs-Protokoll ohne langlebige Keys
**Ecokart Context:**
- GitHub Actions → AWS via OIDC
- Keine AWS Access Keys in GitHub Secrets
- Automatische Token-Rotation

---

### **Orphaned Resources**
**Deutsch:** Verwaiste Ressourcen
**Definition:** AWS Resources die nach Destroy übrig bleiben
**Ecokart Context:**
```
Nach terraform destroy checken:
- NAT Gateways ($32/Monat!)
- RDS Instances
- ECS Clusters
```

---

## P

### **Production**
**Deutsch:** Produktions-Umgebung
**Definition:** Live-System für echte Kunden
**Ecokart Context:**
- main Branch → Production Deploy
- Höchste Ressourcen (1024MB Lambda)
- Point-in-Time Recovery enabled

---

### **Pull Request (PR)**
**Deutsch:** Pull Request, Änderungsantrag
**Definition:** Request zum Mergen von Code-Änderungen
**Ecokart Context:**
- Feature Branch → develop (via PR)
- Code Review erforderlich
- CI Tests müssen grün sein

---

## R

### **Refactoring**
**Deutsch:** Umstrukturierung, Code-Verbesserung
**Definition:** Code verbessern ohne Funktionalität zu ändern
**Ecokart Context:**
- Non-Breaking Refactorings erlaubt ohne Approval
- Breaking Changes → User fragen

---

### **Repository**
**Deutsch:** Repository, Code-Lager
**Definition:** Git-Projekt mit allen Files + History
**Ecokart Context:**
- GitHub: AndySchlegel/Ecokart-Webshop
- Private Repository

---

### **REST API**
**Deutsch:** REST API
**Full:** Representational State Transfer API
**Definition:** HTTP-basierte API (GET, POST, PUT, DELETE)
**Ecokart Context:**
- API Gateway nutzt REST (nicht HTTP API!)
- CLI: `aws apigateway` (nicht `apigatewayv2`)

---

### **Rollback**
**Deutsch:** Rückgängigmachen
**Definition:** Zurück zur vorherigen funktionierenden Version
**Ecokart Context:**
- Git: `git revert` oder `git reset`
- Terraform: Vorherige tfstate wiederherstellen

---

## S

### **Serverless**
**Deutsch:** Serverlos
**Definition:** Cloud-Modell ohne Server-Management
**Ecokart Context:**
- Lambda (Backend)
- DynamoDB (Database)
- API Gateway (Routing)
- Amplify (Frontend Hosting)

---

### **State**
**Deutsch:** Zustand
**Definition:** Aktueller Status der Infrastructure (Terraform)
**Ecokart Context:**
- terraform.tfstate in S3
- Kritisch - NIEMALS manuell ändern!
- DynamoDB Lock verhindert gleichzeitige Änderungen

---

### **State Corruption**
**Deutsch:** Zustandsbeschädigung
**Definition:** Terraform State ist inkonsistent/beschädigt
**Ecokart Context:**
- Passiert bei Architektur-Änderungen
- Symptom: "Provider configuration not present"
- Lösung: Nuclear Cleanup + Fresh Deploy

---

## T

### **Terraform**
**Deutsch:** Terraform (IaC Tool)
**Definition:** Tool für Infrastructure as Code
**Ecokart Context:**
- Version 1.5.0
- Managed alle AWS Resources
- State in S3, Lock in DynamoDB

---

### **Testing**
**Deutsch:** Testen
**Definition:** Code-Funktionalität überprüfen
**Ecokart Context:**
- Unit Tests (planned)
- Integration Tests (planned)
- Manual Testing in Development

---

### **Token**
**Deutsch:** Token, Zugriffsmarke
**Definition:** Credential für API-Zugriffe
**Ecokart Context:**
- JWT Token für User Authentication
- GitHub Token für Amplify
- OIDC Token für AWS Access

---

## V

### **Validation**
**Deutsch:** Validierung, Überprüfung
**Definition:** Prüfung ob Daten/Input korrekt sind
**Ecokart Context:**
- JWT Token Validation im Backend
- User Input Validation (email, password)
- Terraform Plan Validation

---

### **Version Control**
**Deutsch:** Versionskontrolle
**Definition:** Tracking von Code-Änderungen über Zeit
**Ecokart Context:**
- Git als Version Control System
- GitHub als Remote Repository

---

## W

### **Workflow**
**Deutsch:** Arbeitsablauf
**Definition:** Automatisierter Prozess
**Ecokart Context:**
```
GitHub Actions Workflows:
- deploy.yml → Infrastructure Deployment
- destroy.yml → Infrastructure Deletion
- nuclear-cleanup.yml → Emergency Cleanup
```

---

## 📝 Verwendung in Dokumentation

**Format beim ersten Vorkommen:**
```markdown
✅ Das **State Management** (Zustandsverwaltung) funktioniert jetzt.
✅ Der **Circuit Breaker** (Unterbrechungsmechanismus) stoppt nach 3 Versuchen.
```

**Später im selben Dokument:**
```markdown
Der Circuit Breaker ist kritisch für...
(Keine Erklärung nötig, wurde bereits erklärt)
```

---

## 🔄 Update-Prozess

Neue Begriffe hinzufügen:
1. Alphabetisch einsortieren
2. Format beachten:
   ```markdown
   ### **EN-Term**
   **Deutsch:** DE-Übersetzung
   **Definition:** Was ist das?
   **Ecokart Context:** Wo/wie nutzen wir es?
   **Beispiel:** (optional) Code/Command Beispiel
   ```
3. In Session Docs verwenden

---

**Status:** 📊 Aktuell **50+ Begriffe**
**Next Update:** Bei neuen Technical Terms in Sessions
