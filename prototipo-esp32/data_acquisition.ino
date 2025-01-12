#include <stdio.h>
#include <PZEM004Tv30.h>

#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17

#define PZEM_SERIAL Serial2

// Inicializa o sensor PZEM
PZEM004Tv30 pzem(PZEM_SERIAL, PZEM_RX_PIN, PZEM_TX_PIN);

// Função para retornar os dados de consumo atualizados
struct TEnergyConsumption getConsumptionData() {
  TEnergyConsumption consumption;
  consumption.voltage = (float) pzem.voltage();
  consumption.current = (float) pzem.current();
  consumption.power = (float) pzem.power();
  consumption.energy = (float) pzem.energy();
  consumption.frequency = (float) pzem.frequency();
  consumption.pf = (float) pzem.pf();
  strcpy(consumption.measuredAt, getFormattedLocalTime().c_str());

  return consumption;
}

void restartPzemMetrics() {
  pzem.resetEnergy();
}