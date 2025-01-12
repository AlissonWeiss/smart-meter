struct TEnergyConsumption {
  float voltage;     // Tensão em volts
  float current;     // Corrente em amperes
  float power;       // Potência em watts
  float energy;      // Energia em watt-hora
  float frequency;   // Frequência em hertz
  float pf;          // Fator de potência
  char measuredAt[30]; // Data e hora da medição (GMT-0)
};