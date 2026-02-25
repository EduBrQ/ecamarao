# Deploy no GitHub Pages

## 🚀 **Passos para Deploy Automático**

### **1. Ativar GitHub Pages no Repositório:**

1. Vá para **Settings** → **Pages**
2. Selecione **GitHub Actions** como fonte
3. Salve

### **2. Configurar Branch:**

- **Branch Principal:** `main`
- **Workflow:** `.github/workflows/deploy.yml`

### **3. Deploy Automático:**

Toda vez que você fizer **push** para a branch `main`:

```bash
git add .
git commit -m "nova funcionalidade"
git push origin main
```

O GitHub Actions irá:
✅ Buildar o frontend  
✅ Deploy para GitHub Pages  
✅ Publicar em: `https://edubrq.github.io/ecamarao`

## 🌐 **URLs**

- **Produção:** `https://edubrq.github.io/ecamarao`
- **API Backend:** `https://ecamarao-backend.onrender.com`

## ⚙️ **Configurações Importantes**

### **Vite Config:**
```typescript
base: '/ecamarao/'  // Nome do repositório
```

### **API URL:**
```typescript
// Produção usa Render backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://ecamarao-backend.onrender.com' : '');
```

## 🔄 **Deploy Manual (se necessário)**

```bash
# Build local
cd frontend
pnpm build

# Deploy com gh-pages
npm install -g gh-pages
gh-pages -d dist
```

## 🐛 **Troubleshooting**

### **404 em rotas:**
Adicione `404.html` no build:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>EcoMarão</title>
  <script type="text/javascript">
    // Redireciona para index.html mantendo a URL
    var segmentCount = 0;
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + segmentCount).join('/') + '/?p=/' +
      l.pathname.slice(1).split('/').slice(segmentCount).join('/').replace(/&/g, '~and~') +
      (l.search ? '&q=' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body></body>
</html>
```

### **CORS Issues:**
Configure backend para aceitar requests do GitHub Pages:

```javascript
app.use(cors({
  origin: ['https://edubrq.github.io', 'http://localhost:3000']
}));
```
