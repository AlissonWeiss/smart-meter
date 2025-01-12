#include <Adafruit_I2CDevice.h>
#include <Adafruit_ST7735.h>
#include <Adafruit_GFX.h>
#include <qrcode_st7735.h>

#define TFT_SCLK 18  // SCL Pin on ESP32
#define TFT_MOSI 23  // SDA Pin on ESP32
#define TFT_CS 27    // CS Pin - Chip select control pin
#define TFT_DC 13    // DC Pin - Data Command control pin
#define TFT_RST 26   // Reset pin (could connect to RST pin)

#define TFT_MODEL INITR_MINI160x80

#define MAX_SCREEN_STATES 4

#define LINE_LBL_POS_X 5
#define LINE_TEXT_HEIGHT 8
#define LINE_SPACE_BETWEEN_LINES 12
#define LINE_DATA_INITIAL_Y 40
#define VALUE_POS_X 85
#define VALUE_CLEAR_WIDTH 55

Adafruit_ST7735 screen = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);
//Adafruit_ST7735 screen = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCLK, TFT_RST); NÃO UTILIZAR

QRcode_ST7735 qrcode(&screen);

int screenState = 0;  // 0: show consumption, 1: show status, 2: show QR code, 3: screen off
bool isQrCodeDrawn = false;

TEnergyConsumption lastConsumption;       // Variável para armazenar o último dado de consumo
bool hasPreviousConsumptionData = false;  // Flag para verificar se há dados de consumo para mostrar na atualização de tela 

static float lastVoltage = -1.0;
static float lastCurrent = -1.0;
static float lastPower = -1.0;
static float lastEnergy = -1.0;
static float lastFrequency = -1.0;
static float lastPowerFactor = -1.0;

static String lastDateTime = "";

static bool lastWifiConnected = false;
static String lastWifiIP = "";
static bool lastServerOnline = false;
static int lastFilesPending = -1;
static int lastNextExecution = -1;
static uint32_t lastFreeBytes = 0;
static uint32_t lastTotalBytes = 0;

void initializeScreen() {
  screen.initR();
  screen.setSPISpeed(40000000); 
  screen.setRotation(3);
  screen.fillScreen(ST77XX_BLACK);
}

void writeMessageOnScreen(bool resetScreen, String message) {
  if (resetScreen) {
    screen.fillScreen(ST77XX_BLACK);
  }
  screen.setCursor(3, 3);
  screen.setTextSize(1);
  screen.println(message);
}

void writeLabelAndValue(const char* label, float value, uint16_t yPos, int precision, uint16_t valueX, float& lastValue) {
  if (lastValue != value) {
    // Escreve o rótulo
    screen.setTextColor(ST77XX_WHITE);
    screen.setCursor(LINE_LBL_POS_X, yPos);
    screen.print(label);

    // Limpa e escreve o valor atualizado
    screen.fillRect(valueX, yPos, VALUE_CLEAR_WIDTH, LINE_TEXT_HEIGHT, ST77XX_BLACK);
    screen.setTextColor(ST77XX_GREEN);
    screen.setCursor(valueX, yPos);
    screen.println(value, precision);

    // Atualiza o valor anterior
    lastValue = value;
  }
}

void writeConsumeOnScreen(struct TEnergyConsumption consumption) {
  if (screenState != 0) {
    return;
  }

  writeDateTimeOnScreen(); // Atualiza a data/hora

  // Título
  screen.setTextColor(ST77XX_WHITE);
  screen.setTextSize(1);
  screen.setCursor(LINE_LBL_POS_X, LINE_DATA_INITIAL_Y - 15);
  screen.println("Dados da Rede Eletrica");

  // Variável para controlar a posição Y das linhas
  uint16_t currentY = LINE_DATA_INITIAL_Y;

  // Atualiza os dados na tela
  writeLabelAndValue("Tensao: ", consumption.voltage, currentY, 2, VALUE_POS_X, lastVoltage);
  currentY += LINE_SPACE_BETWEEN_LINES;

  writeLabelAndValue("Corrente: ", consumption.current, currentY, 2, VALUE_POS_X, lastCurrent);
  currentY += LINE_SPACE_BETWEEN_LINES;

  writeLabelAndValue("Potencia: ", consumption.power, currentY, 2, VALUE_POS_X, lastPower);
  currentY += LINE_SPACE_BETWEEN_LINES;

  writeLabelAndValue("Consumo: ", consumption.energy, currentY, 5, VALUE_POS_X, lastEnergy);
  currentY += LINE_SPACE_BETWEEN_LINES;

  writeLabelAndValue("Frequencia: ", consumption.frequency, currentY, 2, VALUE_POS_X, lastFrequency);
  currentY += LINE_SPACE_BETWEEN_LINES;

  writeLabelAndValue("Fator Pot.: ", consumption.pf, currentY, 2, VALUE_POS_X, lastPowerFactor);
}

void writeDateTimeOnScreen() {
  static String lastDisplayedTime = ""; // Armazena o último horário exibido

  String currentTime = getFriendlyFormattedLocalTime(); // Obtém o horário atual

  // Atualiza apenas se o horário mudou
  if (currentTime != lastDisplayedTime) {
    // Limpa apenas a área da data e hora
    screen.fillRect(0, 0, screen.width(), 15, ST77XX_BLACK);

    // Configurações de texto
    screen.setTextColor(ST77XX_WHITE);
    screen.setTextSize(1);
    screen.setCursor(5, 5);
    screen.println(currentTime);

    // Atualiza a linha separadora
    screen.drawLine(0, 15, screen.width(), 15, ST77XX_WHITE);

    // Atualiza o estado
    lastDisplayedTime = currentTime;
  }
}

void writeDeviceInfoSection(int y, const char *label, const String &value, uint16_t color) {
  screen.fillRect(0, y, screen.width(), LINE_TEXT_HEIGHT, ST77XX_BLACK);
  screen.setTextColor(ST77XX_WHITE);
  screen.setCursor(LINE_LBL_POS_X, y);
  screen.print(label);
  screen.setTextColor(color);
  screen.println(value);
}

void writeInfosAboutDevice() {
  if (screenState != 1) {
    return;
  }

  // Atualiza a data e hora
  writeDateTimeOnScreen();

  // Título
  screen.setTextColor(ST77XX_WHITE);
  screen.setTextSize(1);
  screen.setCursor(LINE_LBL_POS_X, LINE_DATA_INITIAL_Y - 15);
  screen.println("Status do Smart Meter");

  // Informações sobre o WiFi
  bool wifiConnected = isWifiConnected();
  String wifiIP = wifiConnected ? WiFi.localIP().toString().c_str() : "Desconectado";
  if (wifiConnected != lastWifiConnected || wifiIP != lastWifiIP) {
    uint16_t wifiConnectedColor = wifiConnected ? ST77XX_GREEN : ST77XX_BLUE;
    writeDeviceInfoSection(LINE_DATA_INITIAL_Y, "WiFi: ", wifiConnected ? "Conectado" : "Desconectado", wifiConnectedColor);
    writeDeviceInfoSection(LINE_DATA_INITIAL_Y + LINE_SPACE_BETWEEN_LINES, "WiFi (IP): ", wifiIP, wifiConnected ? ST77XX_WHITE : ST77XX_BLUE);
    lastWifiConnected = wifiConnected;
    lastWifiIP = wifiIP;
  }

  // Informações sobre o servidor FIWARE
  bool serverOnline = isFiwareHealth();
  if (serverOnline != lastServerOnline) {
    uint16_t serverOnlineColor = serverOnline ? ST77XX_GREEN : ST77XX_BLUE;
    writeDeviceInfoSection(LINE_DATA_INITIAL_Y + 2 * LINE_SPACE_BETWEEN_LINES, "Serv. FIWARE: ", serverOnline ? "Disp." : "Indisp.", serverOnlineColor);
    lastServerOnline = serverOnline;
  }

  // Informações sobre arquivos pendentes
  int filesPending = countOfFilesPendingFIWARESend();
  if (filesPending != lastFilesPending) {
    uint16_t filesPendingColor = filesPending == 0 ? ST77XX_GREEN : ST77XX_BLUE;
    writeDeviceInfoSection(LINE_DATA_INITIAL_Y + 3 * LINE_SPACE_BETWEEN_LINES, "Arquivos pend.: ", String(filesPending), filesPendingColor);
    lastFilesPending = filesPending;
  }

  // Informações sobre a próxima tarefa
  int nextExecution = getNextExecutionInSeconds();
  if (nextExecution != lastNextExecution) {
    writeDeviceInfoSection(LINE_DATA_INITIAL_Y + 4 * LINE_SPACE_BETWEEN_LINES, "Prox. tarefa: ", String(nextExecution) + "s", ST77XX_WHITE);
    lastNextExecution = nextExecution;
  }

  // Informações sobre o espaço em disco
  uint32_t totalBytes = LittleFS.totalBytes();
  uint32_t freeBytes = totalBytes - LittleFS.usedBytes();
  if (freeBytes != lastFreeBytes || totalBytes != lastTotalBytes) {
    writeDeviceInfoSection(LINE_DATA_INITIAL_Y + 5 * LINE_SPACE_BETWEEN_LINES, "Esp. disc.: ", 
      String(freeBytes / 1024) + "/" + String(totalBytes / 1024) + " KB", ST77XX_WHITE);
    lastFreeBytes = freeBytes;
    lastTotalBytes = totalBytes;
  }
}

void showQRCode(String smartMeterId) {

  if (isQrCodeDrawn) {
    return;
  }

  screen.fillScreen(ST77XX_BLACK);
  qrcode.init();
  qrcode.create(smartMeterId);
  isQrCodeDrawn = true;
}

void updateScreen(struct TEnergyConsumption consumption) {
  switch (screenState) {
    case 0:
      // Show consumption
      writeConsumeOnScreen(consumption);
      updateConsumptionData(consumption);
      break;
    case 1:
      writeInfosAboutDevice();
      break;
    case 2:
      // Show QR code
      showQRCode(getSmartMeterId());
      break;
    case 3:
      // Turn of screen
      turnOfScreen();
      break;
    default:
      break;
  }
}

void updateConsumptionData(TEnergyConsumption consumption) {
  lastConsumption = consumption;
  hasPreviousConsumptionData = true;
}

void updateScreenWithLocalData() {
  if (!hasPreviousConsumptionData) {
    return;
  }

  updateScreen(lastConsumption);
}

void turnOfScreen() {
  screen.fillScreen(ST77XX_BLACK);
  digitalWrite(BACKLIGHT_PIN, LOW);
}

void resetStaticVariablesAndScreen() {
  screen.fillScreen(ST77XX_BLACK); // Toda vez que limpar a tela dá um "restart" nela

  lastVoltage = -1.0;
  lastCurrent = -1.0;
  lastPower = -1.0;
  lastEnergy = -1.0;
  lastFrequency = -1.0;
  lastPowerFactor = -1.0;

  lastDateTime = "";

  lastWifiConnected = false;
  lastWifiIP = "";
  lastServerOnline = false;
  lastFilesPending = -1;
  lastNextExecution = -1;
  lastFreeBytes = 0;
  lastTotalBytes = 0;
}

void doChangeScreen() {
  resetStaticVariablesAndScreen();
  screenState = screenState + 1;
  if (screenState >= MAX_SCREEN_STATES) {
    screenState = 0;
  }

  if (screenState != 3) {
    digitalWrite(BACKLIGHT_PIN, HIGH);
  }

  isQrCodeDrawn = false;
}