# Ecamarão Mobile App

Aplicativos nativos para iOS e Android que carregam o web app através de WebView.

## Estrutura

```
mobile/
├── android/          # App Android (Kotlin + WebView)
├── ios/              # App iOS (Swift + WebView)
└── README.md
```

## Funcionalidades

### Android
- ✅ WebView com JavaScript habilitado
- ✅ ProgressBar de carregamento
- ✅ Detecção de conectividade
- ✅ Interface JavaScript ↔ Android
- ✅ Navegação com botão voltar
- ✅ Zoom habilitado

### iOS
- ✅ WKWebView com JavaScript
- ✅ ProgressBar de carregamento
- ✅ Interface JavaScript ↔ iOS
- ✅ Suporte a rotação
- ✅ Configuração de segurança (ATS)

## Configuração

### Android
1. Abra o projeto no Android Studio
2. Altere a URL em `MainActivity.kt`:
   ```kotlin
   private const val WEB_APP_URL = "http://localhost:3000" // Desenvolvimento
   // private const val WEB_APP_URL = "https://seu-dominio.com" // Produção
   ```
3. Build e instale no dispositivo/emulador

### iOS
1. Abra `EcamaraoApp.xcodeproj` no Xcode
2. Altere a URL em `EcamaraoApp.swift`:
   ```swift
   guard let url = URL(string: "http://localhost:3000") else { return }
   // Para produção: "https://seu-dominio.com"
   ```
3. Build e rode no simulador/dispositivo

## Comunicação JavaScript ↔ Nativo

### Android
```javascript
// Chamadas JavaScript → Android
Android.showToast("Olá do Android!");
const version = Android.getAppVersion();
const platform = Android.getPlatform();
Android.vibrate(200);
```

### iOS
```javascript
// Chamadas JavaScript → iOS
window.webkit.messageHandlers.iOSApp.postMessage({
    action: "showToast",
    message: "Olá do iOS!"
});

window.webkit.messageHandlers.iOSApp.postMessage({
    action: "getAppVersion"
});
```

## Próximos Passos

- [ ] Configurar ícones e splash screens
- [ ] Adicionar notificações push
- [ ] Implementar cache offline
- [ ] Configurar Deep Links
- [ ] Adicionar autenticação biométrica
- [ ] Integrar com APIs nativas (câmera, GPS)

## Build para Produção

### Android
```bash
cd mobile/android
./gradlew assembleRelease
```

### iOS
- Use Xcode → Product → Archive
- Faça upload para App Store Connect

## Dependências

### Android
- `androidx.webkit:webkit:1.8.0`
- `androidx.appcompat:appcompat:1.6.1`
- `com.google.android.material:material:1.11.0`

### iOS
- `WebKit` (nativo)
- `UIKit` (nativo)
