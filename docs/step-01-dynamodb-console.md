# Step 1: DynamoDB Tables via AWS Console erstellen

**Ziel:** 4 DynamoDB Tables manuell über AWS Console erstellen
**Dauer:** ~20-30 Minuten
**Lernziel:** DynamoDB Table Design verstehen

---

## 📚 WICHTIG: Was du hier lernst

### Konzepte die du verstehst nach diesem Step:

1. **Primary Keys** - Wie DynamoDB Daten identifiziert
2. **Partition Key** - Wie Daten verteilt werden (Performance)
3. **Global Secondary Index (GSI)** - Alternative Abfragemöglichkeiten
4. **Table Settings** - On-Demand vs Provisioned
5. **AWS Console Navigation** - Praktische Erfahrung

---

## 🎯 Table 1: Products Table

### Was speichern wir hier?
Alle Produkte (32 Nike/Jordan Sneakers & Apparel)

### Warum brauchen wir einen GSI?
- **Ohne GSI**: Können nur nach `id` suchen → Einzelne Produkte
- **Mit CategoryIndex**: Können nach `category` filtern → "Zeige alle Schuhe"

---

### Schritt 1.1: Console öffnen

1. **Browser öffnen:** https://eu-north-1.console.aws.amazon.com/dynamodbv2
2. **Region prüfen:** Oben rechts sollte **Stockholm (eu-north-1)** stehen
3. **Falls falsch:** Klicke auf Region-Dropdown → Wähle **Europe (Stockholm) eu-north-1**

**Screenshot-Moment:** Console-Hauptseite

---

### Schritt 1.2: Neue Table erstellen

1. Klicke **"Create table"** (großer oranger Button)
2. Du siehst jetzt das Table-Formular

---

### Schritt 1.3: Table-Details eingeben

**Table name:**
```
ecokart-products
```

**Partition key:**
```
id
Type: String
```

**❓ Was ist ein Partition Key?**
- Der **Hauptschlüssel** deiner Tabelle
- Jeder Eintrag muss eine **einzigartige ID** haben
- DynamoDB verteilt Daten basierend auf diesem Key (→ Performance)

**Beispiel:**
```
id = "prod-001" → Nike Air Max 90
id = "prod-002" → Jordan 1 Retro
```

---

### Schritt 1.4: Table Settings

**Table settings:**
- Wähle **"Customize settings"** (nicht "Default")

**Warum?** Wir wollen einen GSI hinzufügen!

**Read/Write capacity settings:**
- Wähle **"On-demand"**

**❓ On-Demand vs Provisioned?**

| Modus | Beschreibung | Kosten | Wann nutzen? |
|-------|--------------|--------|--------------|
| **On-Demand** | Bezahle nur was du nutzt | $1.25/1M Writes<br>$0.25/1M Reads | Unvorhersehbarer Traffic<br>Development |
| **Provisioned** | Feste Kapazität | ~$0.65/Monat<br>(5 RCU/WCU) | Konstanter Traffic<br>Production |

Für uns: **On-Demand** = Flexibel + Günstig bei wenig Traffic

---

### Schritt 1.5: Secondary Index erstellen

**Scrolle runter zu "Secondary indexes"**

Klicke **"Create global index"**

**Index settings eingeben:**

```
Index name: CategoryIndex
Partition key: category
Type: String
```

**❓ Was macht dieser Index?**

**Ohne CategoryIndex:**
- Query: "Gib mir Produkt mit id='prod-001'" ✅
- Query: "Gib mir alle Schuhe" ❌ Nicht möglich!

**Mit CategoryIndex:**
- Query: "Gib mir alle Schuhe" ✅
- Query: "Gib mir alle Hoodies" ✅
- DynamoDB kann jetzt nach `category` filtern!

**Attribute projections:**
- Wähle **"All"** (alle Attribute in Index kopieren)

Klicke **"Create index"**

---

### Schritt 1.6: Encryption & Tags

**Encryption:**
- Lass **"Owned by Amazon DynamoDB"** ausgewählt
- Kostenlos + Automatisch

**Tags (optional):**
- Kannst du leer lassen
- Oder hinzufügen:
  ```
  Key: Project, Value: Ecokart
  Key: Environment, Value: Production
  ```

---

### Schritt 1.7: Table erstellen

Klicke **"Create table"** (ganz unten)

**Was passiert jetzt?**
- AWS erstellt die Table (~30 Sekunden)
- Status: "Creating" → "Active"
- CategoryIndex Status: "Creating" → "Active"

**⏱️ Warte bis Status "Active" ist** (Refresh-Button oben rechts)

---

## ✅ Table 1 Erfolgreich!

Du hast gelernt:
- ✅ Partition Key definieren
- ✅ Global Secondary Index erstellen
- ✅ On-Demand Billing wählen

---

## 🎯 Table 2: Users Table

### Was speichern wir hier?
User Accounts (Email, Password Hash, Name)

### Warum brauchen wir einen GSI?
- **Login-Flow**: User gibt Email + Password ein
- **Problem**: Partition Key ist `id`, nicht `email`
- **Lösung**: EmailIndex GSI zum Suchen per Email

---

### Schritt 2.1: Neue Table erstellen

1. Klicke **"Create table"**

**Table name:**
```
ecokart-users
```

**Partition key:**
```
id
Type: String
```

---

### Schritt 2.2: Settings & Index

**Table settings:**
- **"Customize settings"**
- **"On-demand"**

**Secondary indexes:**

Klicke **"Create global index"**

```
Index name: EmailIndex
Partition key: email
Type: String
Attribute projections: All
```

**❓ Warum EmailIndex?**

**Login-Ablauf:**
1. User gibt Email ein: `andy@example.com`
2. Backend sucht: "Finde User mit email='andy@example.com'"
3. DynamoDB nutzt EmailIndex → Schnelle Suche!
4. Password-Check → JWT Token

---

### Schritt 2.3: Erstellen

Klicke **"Create table"**

⏱️ Warte bis Status "Active"

---

## 🎯 Table 3: Carts Table

### Was speichern wir hier?
Shopping Carts (1 User = 1 Cart)

### Warum KEIN GSI?
- **1:1 Beziehung**: Ein User hat genau einen Cart
- **Suche nur nach userId** → Kein alternativer Index nötig
- **Einfacher!**

---

### Schritt 3.1: Table erstellen

**Table name:**
```
ecokart-carts
```

**Partition key:**
```
userId
Type: String
```

**Table settings:**
- **"Customize settings"**
- **"On-demand"**

**Secondary indexes:**
- **KEINE!** (leer lassen)

Klicke **"Create table"**

---

## 🎯 Table 4: Orders Table

### Was speichern wir hier?
Bestellungen mit Items, Adresse, Status

### Warum brauchen wir einen GSI?
- **User-Historie**: "Zeige alle Bestellungen von User XYZ"
- **Sortierung**: Neueste Bestellungen zuerst (nach Datum)

---

### Schritt 4.1: Table erstellen

**Table name:**
```
ecokart-orders
```

**Partition key:**
```
id
Type: String
```

---

### Schritt 4.2: GSI mit Sort Key

**Secondary indexes:**

Klicke **"Create global index"**

```
Index name: UserOrdersIndex
Partition key: userId (Type: String)
Sort key: createdAt (Type: String)
Attribute projections: All
```

**❓ Was ist ein Sort Key?**

**Nur Partition Key:**
- Findet alle Orders eines Users
- **Aber:** Unsortiert!

**Partition Key + Sort Key:**
- Findet alle Orders eines Users
- **UND:** Sortiert nach createdAt (neueste zuerst)

**Query-Beispiel:**
```
Gib mir alle Orders von userId="user-123"
sortiert nach createdAt (DESC)
→ Neueste Order ganz oben!
```

---

### Schritt 4.3: Erstellen

Klicke **"Create table"**

⏱️ Warte bis Status "Active"

---

## ✅ ALLE 4 TABLES ERSTELLT!

**Verifizierung in Console:**

1. Gehe zu **"Tables"** (linke Sidebar)
2. Du solltest sehen:

```
✅ ecokart-products   (Status: Active, GSI: CategoryIndex)
✅ ecokart-users      (Status: Active, GSI: EmailIndex)
✅ ecokart-carts      (Status: Active, GSI: keine)
✅ ecokart-orders     (Status: Active, GSI: UserOrdersIndex)
```

**Automatische Verifizierung via CLI:**

Noch besser - nutze das Verify-Script:

```bash
cd backend
npm run dynamodb:verify
```

**Was macht es?**
- ✅ Prüft ob alle 4 Tables existieren
- ✅ Zeigt Status (Active/Creating)
- ✅ Zeigt Item-Count (sollte 0 sein nach Erstellung)
- ✅ Listet alle GSIs auf

---

## 📊 Was du gelernt hast

### DynamoDB Konzepte:
- ✅ **Partition Key** - Hauptschlüssel für eindeutige Identifikation
- ✅ **Global Secondary Index (GSI)** - Alternative Abfragemöglichkeiten
- ✅ **Sort Key** - Sortierung innerhalb eines Index
- ✅ **On-Demand Billing** - Flexible Kostenstruktur

### AWS Console Skills:
- ✅ Navigation in AWS Console
- ✅ DynamoDB Service finden
- ✅ Tables manuell erstellen
- ✅ Indexes konfigurieren

---

## 🚀 Nächster Schritt: Daten migrieren

Jetzt haben wir **leere Tables** - Zeit sie mit Daten zu füllen!

**2 Optionen:**

### Option A: Über CLI (wenn Rechte vorhanden)
```bash
cd backend
npm run dynamodb:migrate
```

### Option B: Manuell über Console
- Einzelne Items per "Create item" Button
- Import via CSV (Advanced)

---

## 💡 Troubleshooting

### Problem: "Table already exists"
**Lösung:** Perfekt! Überspringen und weitermachen

### Problem: "GSI not appearing"
**Lösung:** Refresh-Button oben rechts, warten bis "Active"

### Problem: "Access Denied"
**Lösung:** Prüfe Region (muss eu-north-1 sein), SSO-Login erneuern

---

## 📸 Screenshots für Präsentation

**Wichtige Screenshots:**
1. ✅ Console Hauptseite (4 Tables)
2. ✅ ecokart-products Details (mit CategoryIndex)
3. ✅ ecokart-orders Details (mit UserOrdersIndex + Sort Key)
4. ✅ Table Status "Active"

---

## ⏭️ Weiter zu Step 2

Nach erfolgreichem Setup:
→ **Step 2: Daten in DynamoDB laden**

---

*Step 1 - DynamoDB Tables (Console Edition)*
*Geschätzte Zeit: 20-30 Minuten*
*Kosten: ~$0/Monat (Free Tier + On-Demand)*
