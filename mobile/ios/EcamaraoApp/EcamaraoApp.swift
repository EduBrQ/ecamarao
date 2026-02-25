import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    
    private var webView: WKWebView!
    private var progressBar: UIProgressView!
    
    override func loadView() {
        let webConfiguration = WKWebViewConfiguration()
        webView = WKWebView(frame: .zero, configuration: webConfiguration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        view = webView
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupProgressBar()
        setupWebView()
        loadWebApp()
        
        // Adicionar observer para progresso
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
    }
    
    private func setupProgressBar() {
        progressBar = UIProgressView(progressViewStyle: .default)
        progressBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(progressBar)
        
        NSLayoutConstraint.activate([
            progressBar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressBar.heightAnchor.constraint(equalToConstant: 2)
        ])
    }
    
    private func setupWebView() {
        // Habilitar JavaScript
        webView.configuration.userContentController.addUserScript(
            WKUserScript(
                source: "window.webkit = {messageHandlers: {}};",
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
        )
        
        // Adicionar handler para comunicação JavaScript -> iOS
        webView.configuration.userContentController.add(self, name: "iOSApp")
    }
    
    private func loadWebApp() {
        guard let url = URL(string: "http://localhost:3000") else {
            showError("URL inválida")
            return
        }
        
        let request = URLRequest(url: url)
        webView.load(request)
    }
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        progressBar.progress = 0.0
        
        // Injetar código para detectar plataforma
        webView.evaluateJavaScript("""
            window.isNativeApp = true;
            window.platform = 'iOS';
            window.appVersion = '1.0.0';
        """)
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showError("Erro ao carregar: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showError("Erro ao carregar: \(error.localizedDescription)")
    }
    
    // MARK: - Progress Observer
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "estimatedProgress" {
            progressBar.progress = Float(webView.estimatedProgress)
        }
    }
    
    // MARK: - Helper Methods
    
    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Erro", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - WKScriptMessageHandler

extension ViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let messageBody = message.body as? [String: Any] else { return }
        
        switch message.name {
        case "iOSApp":
            handleNativeCall(messageBody)
        default:
            break
        }
    }
    
    private func handleNativeCall(_ data: [String: Any]) {
        guard let action = data["action"] as? String else { return }
        
        switch action {
        case "showToast":
            if let message = data["message"] as? String {
                showToast(message)
            }
        case "getAppVersion":
            webView.evaluateJavaScript("window.nativeAppVersion = '1.0.0'")
        case "vibrate":
            // Implementar vibração se necessário
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
        default:
            break
        }
    }
    
    private func showToast(_ message: String) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        present(alert, animated: true) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                alert.dismiss(animated: true)
            }
        }
    }
}
