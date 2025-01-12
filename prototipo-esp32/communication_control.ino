void communicateConsume(TEnergyConsumption consumption) {
  sendToLocalVisualization(consumption);
  sendToFIWARE(consumption);
}

void sendToLocalVisualization(TEnergyConsumption consumption) {
  updateScreen(consumption);
}

void sendToFIWARE(TEnergyConsumption consumption) {
  String consumeSerialized = generateConsumeJson(consumption);
  bool shouldSentToLocalStorage = false;
  bool isSentToFiware = false;
  if (!isWifiConnected()) {
    shouldSentToLocalStorage = true;
  } else {
    isSentToFiware = saveConsumeIntoFiware(consumeSerialized);
  }

  if (shouldSentToLocalStorage || !isSentToFiware) {
    sendToLocalStorage(consumption);
  }
}

void sendToLocalStorage(TEnergyConsumption consumption) {
  saveConsumeOnLocalStorage(consumption);
}