#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

String fiwareHost = "http://192.168.68.211:11026";
String fiwareEntitiesPath = "/v2/entities";
String smartMeterIdPattern = "SmartMeter_%s";
String smartMeterExistsQueryParams = "?type=SmartMeter&options=values&attrs=name";
String insertElectricalConsume = fiwareHost + "/v2/op/update";
String orionHealthCheck = fiwareHost + "/version";

const String HEADER_APPLICATION_JSON = "application/json";
const String HEADER_FIWARE_SERVICE = "smart_meter";
const String HEADER_FIWARE_SERVICE_PATH = "/";

bool fiwareIsHealth = false;

bool isFiwareHealth() {
  return fiwareIsHealth;
}

void registerSmartMeterDevice() {

  if (!isWifiConnected()){
    Serial.println("WiFi disconnected.");
    return;
  }

  bool smartMeterExists = checkIfSmartMeterIsRegistered();

  if (!smartMeterExists) {
    registerSmartMeter();
  }
}


bool checkIfSmartMeterIsRegistered() {

  Serial.println("Checking if Smart Meter is already registered.");
  WiFiClient client;
  HTTPClient http;

  String smartMeterId = getSmartMeterId();
  String serverPath = fiwareHost + fiwareEntitiesPath;

  char urlGetSmartMeter[120];

  // Formatando a URL
  snprintf(urlGetSmartMeter, sizeof(urlGetSmartMeter), "%s/%s%s", serverPath.c_str(), smartMeterId.c_str(), smartMeterExistsQueryParams.c_str());
  
  http.begin(client, urlGetSmartMeter);
  http.addHeader("fiware-service", HEADER_FIWARE_SERVICE);
  http.addHeader("fiware-servicepath", HEADER_FIWARE_SERVICE_PATH);

  int httpResponseCode = http.GET();

  // StatusCode 200 significa que já está registrado, 404 significa que não.
  bool isAlreadyRegistered = (httpResponseCode == 200);

  if (isAlreadyRegistered) {
    Serial.println("SmartMeter is already registered!");
  }
  else {
    Serial.println("SmartMeter is not registered yet!");
  }
  
  // Liberando recursos HTTP
  http.end();

  return isAlreadyRegistered;
}


String generateSmartMeterJson() {
  StaticJsonDocument<200> doc;

  String smartMeterId = getSmartMeterId();

  // Contrato do Smart Meter que será persistido no Fiware
  doc["id"] = smartMeterId;
  doc["type"] = "SmartMeter";
  JsonObject name = doc.createNestedObject("name");
  name["type"] = "Text";
  name["value"] = "Não definido";

  String requestBody;
  serializeJson(doc, requestBody);
  
  Serial.print("SmartMeter Serialized: ");
  Serial.println(requestBody);

  return requestBody;
}


bool registerSmartMeter() {
  Serial.println("Registering new Smart Meter.");

  WiFiClient client;
  HTTPClient http;

  String serverPath = fiwareHost + fiwareEntitiesPath;

  String requestBody = generateSmartMeterJson();
  
  http.begin(client, serverPath);
  http.addHeader("Content-Type", HEADER_APPLICATION_JSON);
  http.addHeader("fiware-service", HEADER_FIWARE_SERVICE);
  http.addHeader("fiware-servicepath", HEADER_FIWARE_SERVICE_PATH);
  int httpResponseCode = http.POST(requestBody);

  bool registrationSuccessful = (httpResponseCode == 201); // 201 Created

  if (registrationSuccessful) {
    Serial.println("Successfully registered new Smart Meter.");
  }
  else {
    Serial.println("Error trying to register new Smart Meter.");
  }

  http.end();

  return registrationSuccessful;
}


bool saveConsumeIntoFiware(String consumeSerialized) {
  if (!isFiwareHealth()) {
    Serial.println("FIWARE is not avaiable. Scheduling consume.");
    return false;
  }

  WiFiClient client;
  HTTPClient http;
  
  http.begin(client, insertElectricalConsume);
  http.addHeader("Content-Type", HEADER_APPLICATION_JSON);
  http.addHeader("fiware-service", HEADER_FIWARE_SERVICE);
  http.addHeader("fiware-servicepath", HEADER_FIWARE_SERVICE_PATH);
  
  int httpResponseCode = http.POST(consumeSerialized);

  if (httpResponseCode < 0) {
    Serial.print("Error trying to save FIWARE Consume entity. Http = ");
    Serial.println(httpResponseCode);
    fiwareIsHealth = false;
  }
  else {
    Serial.print("FIWARE Save Successfully. Http = ");
    Serial.println(httpResponseCode);
  }

  bool registrationSuccessful = (httpResponseCode == 204); // 204 No Content

  if (!registrationSuccessful) {
    Serial.println("Error trying to save consume into FIWARE.");
    return false;
  }

  http.end();

  return true;
}


String getSmartMeterId() {
  char* macAddress = getMacAddress();

  char smartMeterId[50];
  snprintf(smartMeterId, sizeof(smartMeterId), smartMeterIdPattern.c_str(), macAddress);

  return smartMeterId;
}

void checkFiwareHealth() {

  Serial.println("Checking FIWARE health.");

  if (!isWifiConnected()) {
    return;
  }

  WiFiClient client;
  HTTPClient http;
  
  http.begin(client, orionHealthCheck);
  http.setTimeout(2000);
  int httpResponseCode = http.GET();

  // StatusCode 200 significa que o servidor está disponível
  fiwareIsHealth = (httpResponseCode == 200);

  if (!isFiwareHealth()) {
    Serial.print("FIWARE not avaible on this moment. FIWARE health check. Http = ");
    Serial.println(httpResponseCode);
  }

  http.end();
}