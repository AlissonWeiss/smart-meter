#include <Arduino.h>
#include <SPI.h>
#include "TEnergyConsumption.h"


#define PIN_RESET_FILES 34
#define BACKLIGHT_PIN 25
#define BUTTON_PIN 0
unsigned long lastPressTime = 0;
unsigned long debounceDelay = 500;  // Tempo de debounce (500ms)

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RESET_FILES, INPUT);
  
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonClick, FALLING); // Quando o pino for LOW (pressionado)

  pinMode(BACKLIGHT_PIN, OUTPUT);
  digitalWrite(BACKLIGHT_PIN, HIGH);

  if (!startFileSystem()) {
    return;
  }
  // Se o pino estiver HIGH no momento do restart, os arquivos serão apagados
  bool resetFilesFlag = digitalRead(PIN_RESET_FILES) == HIGH;
  initSystemFiles(resetFilesFlag);
  // Remover comentário para resetar o contador de energia do PZEM
  // restartPzemMetrics();

  initializeScreen();
  connectToSavedWiFi();
  setupWiFiAccessPoint();
  initiateDateTimeUtils();

  checkFiwareHealth();
  registerSmartMeterDevice();

  scheduleTask(updateScreenWithLocalData, 500, true);          // Atualiza a tela a cada meio segundo para atualizar data e hora 
  scheduleTask(doProcessConsume, 5000, true);                  // Busca dados da rede elétrica para enviar ao FIWARE
  scheduleTask(reconnectToWifi, 60000, false);                 // Verifica se precisa reconectar WiFi a cada minuto
  scheduleTask(checkFiwareHealth, 60000, false);               // Verifica a saúde do FIWARE a cada minuto
  scheduleTask(sendConsumeDataSavedLocally, 60000, false);     // Verifica se há dados para enviar ao Fiware
}

void loop() {
  handleServer();
  executeScheduledTasks();
  delay(200);
}

void onButtonClick() {
  if (millis() - lastPressTime > debounceDelay) {
    Serial.println("Botão pressionado. Trocando de tela...");
    doChangeScreen();
    lastPressTime = millis();  // Atualiza o tempo do último clique
  }
}