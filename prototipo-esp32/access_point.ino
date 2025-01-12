#include <WebServer.h>
#include <WiFi.h>


WebServer server(80);


void handleServer() {
  server.handleClient(); // Processa as requisições HTTP
}

void setupWiFiAccessPoint() {
  const char* apSSID = "ESP32_SmartMeter";
  const char* apPassword = "ESP32_SmartMeter";

  WiFi.softAP(apSSID, apPassword);

  IPAddress apIP = WiFi.softAPIP();
  Serial.println("Access Point iniciado:");
  Serial.println("SSID: " + String(apSSID));
  Serial.println("Senha: " + String(apPassword));
  Serial.println("IP do AP: " + apIP.toString());

  // Página inicial
  server.on("/", HTTP_GET, []() {
    Serial.println("Cliente acessou a página inicial."); // Adicionado
    String html = "<h1>Configurar Wi-Fi</h1>";
    html += "<form action='/test-wifi' method='post'>";
    html += "SSID: <input type='text' name='ssid'><br>";
    html += "Senha: <input type='password' name='password'><br>";
    html += "<button type='submit'>Enviar</button>";
    html += "</form>";
    server.send(200, "text/html", html);
  });

  // Teste de credenciais
  server.on("/test-wifi", HTTP_POST, []() {
    if (server.hasArg("ssid") && server.hasArg("password")) {
      String ssid = server.arg("ssid");
      String password = server.arg("password");

      Serial.println("Recebendo novas credenciais:");
      Serial.println("SSID: " + ssid);
      Serial.println("Senha: " + password);

      WiFi.begin(ssid.c_str(), password.c_str());
      unsigned long startAttemptTime = millis();
      while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
        delay(500);
        Serial.print(".");
      }

      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConexão bem-sucedida!");
        server.send(200, "text/plain", "Conexão bem-sucedida! Credenciais salvas.");
      } else {
        Serial.println("\nFalha ao conectar.");
        server.send(200, "text/plain", "Falha ao conectar. Por favor, verifique as credenciais.");
      }
    } else {
      Serial.println("Parâmetros ausentes.");
      server.send(400, "text/plain", "Parâmetros ausentes.");
    }
  });

  server.begin(); // Importante: Inicia o servidor HTTP
  Serial.println("Servidor HTTP iniciado.");
}

