# 📊 Monitoring & CloudWatch Alarms Guide

**Erstellt:** 23. November 2025
**Ziel:** Production-ready Monitoring für Ecokart Webshop

---

## 📌 Overview

Ecokart nutzt **AWS CloudWatch Alarms** für Production Monitoring. Bei kritischen Events (Errors, Performance Issues, Throttling) werden Notifications via **SNS Topic** verschickt.

---

## 🚨 Aktive CloudWatch Alarms

### **Lambda Monitoring**

| Alarm | Trigger | Severity | Was bedeutet das? |
|-------|---------|----------|-------------------|
| **Lambda Errors** | > 5 Errors in 5 Min | HIGH | API gibt Errors zurück (500er) |
| **Lambda Duration** | Avg > 10 Sekunden | MEDIUM | Performance Problem (langsame Responses) |
| **Lambda Throttles** | > 1 Throttle | HIGH | Concurrency Limit erreicht (zu viele gleichzeitige Requests) |

### **DynamoDB Monitoring**

| Alarm | Trigger | Severity | Was bedeutet das? |
|-------|---------|----------|-------------------|
| **Products Read Throttles** | > 1 Throttle Event | HIGH | Products Table hat nicht genug Read Capacity |
| **Products Write Throttles** | > 1 Throttle Event | HIGH | Products Table hat nicht genug Write Capacity |
| **Carts Write Throttles** | > 1 Throttle Event | HIGH | Carts Table überlastet (häufigste Writes) |
| **Orders Write Throttles** | > 1 Throttle Event | HIGH | Orders Table überlastet |

### **API Gateway Monitoring**

| Alarm | Trigger | Severity | Was bedeutet das? |
|-------|---------|----------|-------------------|
| **5xx Server Errors** | > 5 Errors in 5 Min | HIGH | Backend gibt Server Errors zurück |
| **4xx Client Errors** | > 100 Errors in 5 Min | MEDIUM | Ungewöhnlich viele Client Errors (möglicher Angriff) |

---

## 📧 Email Notifications Setup

⚠️ **WICHTIG:** Bei jedem `destroy` + `deploy` Cycle werden die Alarms neu erstellt!
→ Email Subscription muss **nach jedem Deploy** neu hinzugefügt werden.

### **Manuelle Email Subscription (nach jedem Deploy)**

```bash
# 1. Hole SNS Topic ARN aus Terraform Output
terraform output monitoring_sns_topic_arn

# 2. Subscribe deine Email
aws sns subscribe \
  --topic-arn arn:aws:sns:eu-north-1:ACCOUNT_ID:ecokart-development-monitoring-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region eu-north-1

# 3. Bestätige Email (AWS schickt Confirmation Email)
# Check Inbox und click "Confirm subscription"
```

### **Alternative: Terraform Managed Subscription (Optional)**

In `terraform/monitoring.tf` aktivieren:

```hcl
# Uncomment diese Zeilen:
resource "aws_sns_topic_subscription" "monitoring_email" {
  topic_arn = aws_sns_topic.monitoring_alerts.arn
  protocol  = "email"
  endpoint  = var.monitoring_email
}
```

Dann in `terraform/variables.tf` hinzufügen:

```hcl
variable "monitoring_email" {
  description = "Email address for monitoring alerts"
  type        = string
  default     = "your-email@example.com"
}
```

⚠️ **Problem:** Email Confirmation ist manuell erforderlich (AWS Security).
→ Nach jedem Deploy kommt neue Confirmation Email!

---

## 🔍 CloudWatch Console

### **Alarms anschauen:**

1. Gehe zu [AWS CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. Linke Sidebar → **Alarms** → **All alarms**
3. Filter: `ecokart-development-*`

### **Alarm History:**

- Click auf einen Alarm → Tab **History**
- Zeigt wann Alarm triggered wurde

### **SNS Topic verifizieren:**

1. Gehe zu [AWS SNS Console](https://console.aws.amazon.com/sns/)
2. Topics → `ecokart-development-monitoring-alerts`
3. Tab **Subscriptions** → Check ob Email subscribed ist

---

## 🎯 Was tun bei Alarms?

### **Lambda Errors Alarm**

**Ursachen:**
- Backend Code Bug (500 Error)
- DynamoDB Table nicht erreichbar
- Environment Variables fehlen
- IAM Permissions fehlen

**Debug Steps:**
1. Check Lambda CloudWatch Logs: [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Suche nach `ERROR` oder `Exception` in Logs
3. Check ob DynamoDB Tables existieren
4. Verifiziere IAM Role Permissions

### **Lambda Duration Alarm**

**Ursachen:**
- Cold Start (erste Invocation nach langer Pause)
- Langsame DynamoDB Query
- Zu große Response Body
- Network Issues

**Debug Steps:**
1. Check Lambda Metrics: Durchschnittliche Duration
2. Optimiere DynamoDB Queries (Indexes nutzen)
3. Reduziere Response Body Size
4. Erhöhe Lambda Memory (falls nötig)

### **DynamoDB Throttles Alarm**

**Ursachen:**
- Billing Mode = PROVISIONED mit zu niedrigen Capacity Units
- Burst über provisioned capacity
- Hot Partition Key (alle Requests gehen an eine Partition)

**Fix:**
- **Kurzfristig:** Erhöhe Read/Write Capacity Units
- **Langfristig:** Wechsel zu **PAY_PER_REQUEST** Billing Mode

In `terraform/modules/dynamodb/main.tf`:
```hcl
billing_mode = "PAY_PER_REQUEST"
```

### **API Gateway 5xx Errors**

**Ursachen:**
- Lambda Function Error (siehe Lambda Errors)
- Lambda Timeout (> 30 Sekunden)
- IAM Permission für Lambda Invoke fehlt

**Debug Steps:**
1. Check API Gateway Logs in CloudWatch
2. Check Lambda Logs
3. Verifiziere Lambda Timeout Setting

---

## 🔔 Slack Integration (Optional)

Statt Email kannst du auch Slack nutzen:

### **Option A: AWS Chatbot (Empfohlen)**

1. Gehe zu [AWS Chatbot Console](https://console.aws.amazon.com/chatbot/)
2. Configure Slack Workspace
3. Create Slack Channel (z.B. `#ecokart-alerts`)
4. Link SNS Topic zu Slack Channel

### **Option B: Lambda + Slack Webhook**

Erstelle Lambda Function die SNS → Slack Webhook transformiert.

---

## 📊 Monitoring Dashboard (Optional)

Erstelle CloudWatch Dashboard für Übersicht:

```bash
# Via AWS Console:
CloudWatch → Dashboards → Create Dashboard
# Add Widgets für:
# - Lambda Invocations
# - Lambda Errors
# - Lambda Duration
# - DynamoDB Throttles
# - API Gateway Requests
```

---

## 🔧 Troubleshooting

### **Ich bekomme keine Emails!**

✅ **Check:**
1. SNS Subscription Status: `PendingConfirmation` oder `Confirmed`?
2. Email Confirmation Link geclicked?
3. Spam Folder checken
4. Email-Adresse korrekt?

```bash
# Check Subscriptions:
aws sns list-subscriptions-by-topic \
  --topic-arn $(terraform output -raw monitoring_sns_topic_arn) \
  --region eu-north-1
```

### **Alarm wird nicht getriggert!**

✅ **Check:**
1. Ist der Alarm "In alarm" Status? (CloudWatch Console)
2. Hat der Alarm Actions konfiguriert? (`alarm_actions`)
3. Ist SNS Topic ARN korrekt?

### **Alarm triggered bei normalem Betrieb!**

→ **Threshold anpassen** in `terraform/monitoring.tf`:
```hcl
threshold = 10  # Erhöhe Wert
```

---

## 📝 Best Practices

### **Development vs Production**

| Environment | Alarm Thresholds | Email Notifications |
|-------------|------------------|---------------------|
| **Development** | Hoch (weniger sensitiv) | Optional |
| **Production** | Niedrig (früh warnen) | Pflicht! |

**Warum?**
- Dev: Häufige Deployments, Experimente → weniger Alarms
- Prod: Stabilität wichtig → sofort bei Problemen warnen

### **Alarm Fatigue vermeiden**

❌ **Zu viele False Positives** → Team ignoriert Alarms
✅ **Thresholds richtig setzen** → Nur echte Probleme

**Tipp:** Nach 1-2 Wochen Production Traffic → Thresholds anpassen basierend auf echten Metriken.

---

## 🎯 Zusammenfassung

**Was haben wir?**
- ✅ 9 CloudWatch Alarms für Lambda, DynamoDB, API Gateway
- ✅ SNS Topic für Notifications
- ✅ Severity Tags (HIGH, MEDIUM)

**Was fehlt noch?**
- ⏳ Email Subscription (manuell nach jedem Deploy)
- ⏳ Slack Integration (optional)
- ⏳ CloudWatch Dashboard (optional)

**Nächste Schritte:**
1. Nach jedem Deploy: Email Subscription hinzufügen
2. Bei Go Live: Wechsel zu Terraform-managed Email Subscription
3. Monitoring Dashboard erstellen für besseren Überblick

---

**Updated:** 23. November 2025
**Status:** ✅ Production Ready (mit manueller Email Setup)
