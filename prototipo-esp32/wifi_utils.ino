#include <Arduino.h>
#include <WiFi.h>
#include "esp_efuse.h"


bool isWifiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

void reconnectToWifi() {
  if (!isWifiConnected()) {
    connectToSavedWiFi();
  } else {
    Serial.println("WiFi already connected!");
  }
}

void connectToSavedWiFi() {

  if (LittleFS.exists("/wifi.txt")) {
    File file = LittleFS.open("/wifi.txt", "r");
    String ssid = file.readStringUntil('\n');
    String password = file.readStringUntil('\n');
    file.close();

    ssid.trim();
    password.trim();

    Serial.println("Tentando conectar com credenciais salvas...");
    WiFi.begin(ssid.c_str(), password.c_str());

    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
      delay(500);
      Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nConectado à rede salva!");
      Serial.println("IP: " + WiFi.localIP().toString());
    } else {
      Serial.println("\nFalha ao conectar com as credenciais salvas.");
    }
  } else {
    Serial.println("Nenhuma credencial salva encontrada.");
  }
}

char* getMacAddress() {
  String mac = WiFi.macAddress();
  char* macStr = (char*)malloc((mac.length() + 1) * sizeof(char));
  if (macStr) {
    strcpy(macStr, mac.c_str());
  }
  return macStr;
}

void tryNewWiFi(const char* ssid, const char* password) {
  Serial.println("Testando novas credenciais...");
  WiFi.begin(ssid, password);

  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nNovas credenciais funcionaram!");
    saveWiFiCredentials(ssid, password);
  } else {
    Serial.println("\nFalha ao conectar com as novas credenciais.");
  }

  // Reconectar à rede original se necessário
  connectToSavedWiFi();
}

void saveWiFiCredentials(const char* ssid, const char* password) {
  File file = LittleFS.open("/wifi.txt", "w");
  if (file) {
    file.println(ssid);
    file.println(password);
    file.close();
    Serial.println("Novas credenciais salvas no LittleFS!");
  } else {
    Serial.println("Erro ao salvar credenciais!");
  }
}