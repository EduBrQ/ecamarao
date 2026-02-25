// Detecção de plataforma e dispositivo
export const isNativeApp = (): boolean => {
  return window.isNativeApp === true;
};

export const isAndroid = (): boolean => {
  return window.platform === 'Android' || 
         /Android/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  return window.platform === 'iOS' || 
         /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const isMobile = (): boolean => {
  return isAndroid() || isIOS() || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTablet = (): boolean => {
  return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
};

export const isSmallScreen = (): boolean => {
  return window.innerWidth < 768;
};

// Comunicação com apps nativos
export const nativeAPI = {
  showToast: (message: string) => {
    if (isAndroid() && window.Android) {
      window.Android.showToast(message);
    } else if (isIOS() && window.webkit?.messageHandlers?.iOSApp) {
      window.webkit.messageHandlers.iOSApp.postMessage({
        action: "showToast",
        message
      });
    } else {
      // Fallback para browser
      alert(message);
    }
  },

  getAppVersion: (): string => {
    if (isAndroid() && window.Android) {
      return window.Android.getAppVersion();
    } else if (isIOS() && window.webkit?.messageHandlers?.iOSApp) {
      // Para iOS, precisamos solicitar a versão
      window.webkit.messageHandlers.iOSApp.postMessage({
        action: "getAppVersion"
      });
      return window.nativeAppVersion || "1.0.0";
    }
    return "1.0.0";
  },

  vibrate: (duration: number = 200) => {
    if (isAndroid() && window.Android) {
      window.Android.vibrate(duration);
    } else if (isIOS() && window.webkit?.messageHandlers?.iOSApp) {
      window.webkit.messageHandlers.iOSApp.postMessage({
        action: "vibrate",
        duration
      });
    } else if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }
};

// Adicionar tipos para o window
declare global {
  interface Window {
    isNativeApp?: boolean;
    platform?: string;
    appVersion?: string;
    nativeAppVersion?: string;
    Android?: {
      showToast: (message: string) => void;
      getAppVersion: () => string;
      getPlatform: () => string;
      vibrate: (duration?: number) => void;
    };
    webkit?: {
      messageHandlers?: {
        iOSApp: {
          postMessage: (data: any) => void;
        };
      };
    };
  }
}
