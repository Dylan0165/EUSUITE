# EUsuite Login

**Officiële SSO-loginpagina voor het EUsuite Platform**

EUsuite Login is de centrale authenticatie-app voor alle EUsuite applicaties (EuCloud, EuType, EuSheets, etc.). Deze app zorgt voor een naadloze Single Sign-On (SSO) ervaring via HttpOnly cookies.

## 🎯 Functionaliteit

- **Centraal inloggen**: Eén login voor alle EUsuite apps
- **SSO via HttpOnly cookies**: Veilige authenticatie zonder localStorage
- **Automatische redirects**: Keert terug naar de originele app na login
- **Pure frontend**: Geen eigen backend nodig
- **Moderne UI**: Responsief en gebruiksvriendelijk ontwerp

## 🏗️ Architectuur

```
┌─────────────────────┐
│  EUsuite Login      │  (React + Vite)
│  Port: 30090        │
└──────────┬──────────┘
           │ POST /api/auth/login
           ├─────────────────────────┐
           │                         │
┌──────────▼──────────┐     ┌───────▼────────┐
│  EU-CORE-BACKEND    │     │  SSO Cookie    │
│  Port: 30500        │────►│  (HttpOnly)    │
│  (FastAPI)          │     └────────────────┘
└─────────────────────┘
```

### Workflow

1. **Gebruiker bezoekt app** → `http://192.168.124.50:30080`
2. **App redirect naar login** → `http://192.168.124.50:30090/login?redirect=http://192.168.124.50:30080`
3. **Gebruiker logt in** → Credentials naar `EU-CORE-BACKEND`
4. **Backend set SSO cookie** → HttpOnly cookie met token
5. **Redirect terug** → Naar originele app met cookie
6. **App valideert cookie** → Gebruiker is ingelogd!

## 🚀 Installatie en Gebruik

### Lokaal Ontwikkelen

```bash
# Installeer dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:3000/login
```

### Docker Build

```bash
# Build image
docker build -t eusuite-login:latest .

# Run container
docker run -p 8080:80 eusuite-login:latest

# Test
# http://localhost:8080/login
```

### Kubernetes Deployment

#### Stap 1: Push naar Docker Hub

```bash
# Login bij Docker Hub
docker login

# Tag image
docker tag eusuite-login:latest docker.io/<DOCKER_USERNAME>/eusuite-login:latest

# Push image
docker push docker.io/<DOCKER_USERNAME>/eusuite-login:latest
```

#### Stap 2: Deploy naar Kubernetes

```bash
# Pas deployment.yaml aan (vervang <DOCKER_USERNAME>)
# Zie k8s/deployment.yaml

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Controleer deployment
kubectl get pods -n eucloud
kubectl get svc -n eucloud
```

#### Stap 3: Test de app

```bash
# Verkrijg node IP
kubectl get nodes -o wide

# Open browser
# http://<NODE_IP>:30090/login
```

## 🔧 Configuratie

### Backend URL Aanpassen

In `src/pages/Login.jsx`:

```javascript
const API_URL = 'http://192.168.124.50:30500/api/auth/login'
const DEFAULT_REDIRECT = 'http://192.168.124.50:30080'
```

### NodePort Aanpassen

In `k8s/service.yaml`:

```yaml
nodePort: 30090  # Wijzig naar gewenste port
```

## 📦 CI/CD met GitHub Actions

### GitHub Secrets Instellen

Ga naar **Settings → Secrets and variables → Actions** en voeg toe:

- `DOCKER_USERNAME`: Jouw Docker Hub gebruikersnaam
- `DOCKER_PASSWORD`: Jouw Docker Hub wachtwoord of access token

### Workflow

De GitHub Actions workflow (`.github/workflows/deploy.yml`) doet het volgende:

1. **Build**: Bouwt Docker image bij elke push
2. **Push**: Pushed image naar Docker Hub
3. **Deploy**: Deployed naar Kubernetes (alleen op `main` branch via self-hosted runner)

### Self-Hosted Runner

Voor deployment naar je Kubernetes cluster heb je een self-hosted runner nodig:

```bash
# Op je Kubernetes node/master
# Ga naar: Settings → Actions → Runners → New self-hosted runner
# Volg de instructies om de runner te installeren
```

## 🔐 Security Features

- **HttpOnly Cookies**: Token is niet toegankelijk via JavaScript
- **credentials: "include"**: Cookies worden meegestuurd bij requests
- **CORS**: Backend moet CORS instellen voor allowed origins
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.

## 📁 Project Structuur

```
eusuite-login/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── k8s/
│   ├── namespace.yaml          # Kubernetes namespace
│   ├── deployment.yaml         # Kubernetes deployment
│   └── service.yaml            # Kubernetes service (NodePort)
├── src/
│   ├── pages/
│   │   ├── Login.jsx           # Login pagina component
│   │   └── Login.css           # Login styling
│   ├── App.jsx                 # App routing
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styling
├── Dockerfile                  # Multi-stage Docker build
├── nginx.conf                  # Nginx configuratie
├── vite.config.js              # Vite configuratie
├── package.json                # Dependencies
└── README.md                   # Deze file
```

## 🌐 Gebruik in Apps

### Redirect naar Login

Wanneer een gebruiker niet ingelogd is:

```javascript
// In je EUsuite app (bijv. EuCloud)
const currentUrl = window.location.href
window.location.href = `http://192.168.124.50:30090/login?redirect=${encodeURIComponent(currentUrl)}`
```

### Cookie Valideren

```javascript
// In je EUsuite app
const response = await fetch('http://192.168.124.50:30500/api/auth/verify', {
  credentials: 'include'  // Stuurt SSO cookie mee
})

if (!response.ok) {
  // Redirect naar login
  window.location.href = `http://192.168.124.50:30090/login?redirect=${encodeURIComponent(window.location.href)}`
}
```

## 🛠️ Troubleshooting

### CORS Errors

Zorg dat je backend de volgende headers set:

```python
# In FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://192.168.124.50:30090",  # EUsuite Login
        "http://192.168.124.50:30080",  # EuCloud
        # Voeg andere apps toe
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Cookie Wordt Niet Gezet

- Controleer of `credentials: "include"` is ingesteld
- Controleer of backend `Set-Cookie` header stuurt met `HttpOnly` flag
- Zorg dat alle apps op hetzelfde domein/IP draaien (of gebruik SameSite=None met HTTPS)

### Deployment Faalt

```bash
# Check logs
kubectl logs -n eucloud -l app=eusuite-login

# Check events
kubectl get events -n eucloud --sort-by='.lastTimestamp'

# Restart deployment
kubectl rollout restart deployment/eusuite-login -n eucloud
```

## 📝 API Endpoints

### Backend (EU-CORE-BACKEND)

**POST** `/api/auth/login`
```json
Request:
{
  "username": "dylan",
  "password": "wachtwoord123"
}

Response (200):
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}

Headers:
Set-Cookie: sso_token=eyJ...; HttpOnly; Path=/; Max-Age=86400
```

## 🎨 UI Aanpassingen

De UI is volledig aanpasbaar via CSS. Pas `src/pages/Login.css` aan voor custom styling:

```css
/* Pas gradient kleuren aan */
.login-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Pas border radius aan */
.login-card {
  border-radius: 16px;
}
```

## 📊 Monitoring

```bash
# Check pod status
kubectl get pods -n eucloud -l app=eusuite-login

# Check service
kubectl get svc -n eucloud eusuite-login

# Check logs
kubectl logs -n eucloud -l app=eusuite-login --tail=100 -f

# Check resource usage
kubectl top pods -n eucloud -l app=eusuite-login
```

## 🔄 Updates Uitrollen

```bash
# Bouw nieuwe versie
docker build -t docker.io/<DOCKER_USERNAME>/eusuite-login:v1.1.0 .
docker push docker.io/<DOCKER_USERNAME>/eusuite-login:v1.1.0

# Update deployment
kubectl set image deployment/eusuite-login \
  eusuite-login=docker.io/<DOCKER_USERNAME>/eusuite-login:v1.1.0 \
  -n eucloud

# Of via GitHub Actions: push naar main branch
```

## 📄 Licentie

© 2025 EUsuite Platform - Alle rechten voorbehouden

## 🤝 Support

Voor vragen of problemen, neem contact op met het EUsuite team.

---

**Gebouwd met ❤️ voor het EUsuite Platform**
