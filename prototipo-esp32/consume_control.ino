#include <ArduinoJson.h>
#include <HTTPClient.h>

const String ELECTRICAL_CONSUME_TYPE = "ElectricalConsume";


void doProcessConsume() {
  TEnergyConsumption consumption = getConsumptionData();
  communicateConsume(consumption);
}


String generateConsumeJson(TEnergyConsumption consumption) {

  StaticJsonDocument<1024> doc;
  doc["actionType"] = "append";
  JsonArray entities = doc.createNestedArray("entities");
  
  String smartMeterId = getSmartMeterId();

  // Contrato do Smart Meter que será persistido no Fiware
  JsonObject jsonConsume = entities.createNestedObject();

  jsonConsume["id"] = getElectricalConsumeId(smartMeterId);
  jsonConsume["type"] = ELECTRICAL_CONSUME_TYPE;
  
  JsonObject jsonRefSmartMeter = jsonConsume.createNestedObject("refSmartMeter");
  jsonRefSmartMeter["type"] = "Relationship";
  jsonRefSmartMeter["value"] = smartMeterId;

  JsonObject jsonVoltage = jsonConsume.createNestedObject("voltage");
  jsonVoltage["type"] = "Float";
  jsonVoltage["value"] = consumption.voltage;

  JsonObject jsonCurrent = jsonConsume.createNestedObject("current");
  jsonCurrent["type"] = "Float";
  jsonCurrent["value"] = consumption.current;  

  JsonObject jsonPower = jsonConsume.createNestedObject("power");
  jsonPower["type"] = "Float";
  jsonPower["value"] = consumption.power;  

  JsonObject jsonEnergy = jsonConsume.createNestedObject("energy");
  jsonEnergy["type"] = "Float";
  jsonEnergy["value"] = consumption.energy;

  JsonObject jsonFrequency = jsonConsume.createNestedObject("frequency");
  jsonFrequency["type"] = "Float";
  jsonFrequency["value"] = consumption.frequency;

  JsonObject jsonPowerFactor = jsonConsume.createNestedObject("pf");
  jsonPowerFactor["type"] = "Float";
  jsonPowerFactor["value"] = consumption.pf;

  JsonObject jsonMeasuredAt = jsonConsume.createNestedObject("measuredAt");
  jsonMeasuredAt["type"] = "DateTime";
  jsonMeasuredAt["value"] = consumption.measuredAt;

  String requestBody;
  serializeJson(doc, requestBody);

  return requestBody;
}


String getElectricalConsumeId(String smartMeterId) {

  smartMeterId.replace(":", "");

  return ELECTRICAL_CONSUME_TYPE + "_" + smartMeterId;
}