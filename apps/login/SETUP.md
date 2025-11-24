# 🚀 EUsuite Login - Setup Guide

## Stap 1: Docker Hub Access Token Aanmaken

1. Ga naar Docker Hub: https://hub.docker.com/settings/security
2. Klik op **"New Access Token"**
3. Geef een naam: `github-actions-eusuite-login`
4. Permissions: **Read, Write, Delete**
5. Klik op **"Generate"**
6. **KOPIEER DE TOKEN** (je kunt hem maar 1x zien!)

## Stap 2: GitHub Secrets Instellen

1. Ga naar je GitHub repository: https://github.com/Dylan016504/eusuite-login
2. Ga naar **Settings** → **Secrets and variables** → **Actions**
3. Klik op **"New repository secret"**
4. Voeg toe:
   - **Name**: `DOCKER_USERNAME`
   - **Secret**: `dylan016504`
5. Klik op **"New repository secret"** (nogmaals)
6. Voeg toe:
   - **Name**: `DOCKER_PASSWORD`
   - **Secret**: `[PLAK HIER JE DOCKER TOKEN]`

## Stap 3: Self-Hosted Runner Setup (op je K3s server)

SSH naar je K3s server (192.168.124.50):

```bash
# Op de K3s server
ssh user@192.168.124.50

# Ga naar GitHub repository settings
# Settings → Actions → Runners → New self-hosted runner

# Volg de instructies om de runner te installeren:
# 1. Download
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# 2. Configure
./config.sh --url https://github.com/Dylan016504/eusuite-login --token [TOKEN_VAN_GITHUB]

# 3. Als service installeren (blijft draaien)
sudo ./svc.sh install
sudo ./svc.sh start

# 4. Check status
sudo ./svc.sh status
```

## Stap 4: Git Push naar GitHub

```powershell
# In je LoginPageCloud directory
git add .
git commit -m "Initial commit: EUsuite Login with CI/CD"
git branch -M main
git remote add origin https://github.com/Dylan016504/eusuite-login.git
git push -u origin main
```

## Stap 5: Automatische Deployment

Na de push:
1. GitHub Actions start automatisch
2. Build de Docker image
3. Push naar Docker Hub als `dylan016504/eusuite-login:latest`
4. Deploy via self-hosted runner naar K3s
5. Pod draait in namespace `eucloud` op NodePort `30090`

## 🎯 Toegang tot de app

Na deployment:
```
http://192.168.124.50:30090/login
```

## 🔍 Troubleshooting

### Check GitHub Actions
- Ga naar **Actions** tab in je repository
- Zie de workflow logs

### Check Kubernetes
```bash
# SSH naar K3s server
ssh user@192.168.124.50

# Check pods
kubectl get pods -n eucloud

# Check service
kubectl get svc -n eucloud

# Check logs
kubectl logs -n eucloud -l app=eusuite-login --tail=100

# Restart deployment
kubectl rollout restart deployment/eusuite-login -n eucloud
```

### Check Runner
```bash
# Op K3s server
cd ~/actions-runner
sudo ./svc.sh status

# Restart runner
sudo ./svc.sh restart
```

## 📝 Volgende Deploys

Bij elke commit naar `main`:
```powershell
git add .
git commit -m "Update: beschrijving"
git push
```

→ Automatisch deployed naar K3s! 🎉
