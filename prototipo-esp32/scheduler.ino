struct Task {
  uint32_t executeTime;         // Quando a tarefa deve ser executada, em millis()
  uint32_t interval;            // Intervalo de repetição da tarefa
  void (*taskFunction)();       // Ponteiro para a função da tarefa
  bool skipNextExecutionCheck;  // Flag para desconsiderar no cálculo do tempo para próxima task
};

Task taskList[10];  // Lista de tarefas
int taskCount = 0;  // Contador de tarefas

void scheduleTask(void (*func)(), uint32_t interval, bool skipNextExecutionCheck) {
  if (taskCount < 10) {
    taskList[taskCount].taskFunction = func;
    taskList[taskCount].interval = interval;
    taskList[taskCount].executeTime = millis() + interval;
    taskList[taskCount].skipNextExecutionCheck = skipNextExecutionCheck;
    taskCount++;
  }
}

// Percorre a lista de tarefas agendadas, as executa em caso de tempo de execução já ter passado. Depois incrementa para agendar a proxima execução
void executeScheduledTasks() {
  uint32_t currentTime = millis();
  for (int i = 0; i < taskCount; i++) {
    // Calcula a diferença
    if ((int32_t)(currentTime - taskList[i].executeTime) >= 0) {
      taskList[i].taskFunction();                       // Executa a tarefa
      taskList[i].executeTime += taskList[i].interval;  // Altera o horário da próxima execução

      // Corrige o executeTime se passar do momento atual para evitar execução contínua
      while ((int32_t)(millis() - taskList[i].executeTime) >= 0) {
        taskList[i].executeTime += taskList[i].interval;
      }
    }
  }
}

int getNextExecutionInSeconds() {
  uint32_t currentTime = millis();
  uint32_t smallestTime = UINT32_MAX;

  for (int i = 0; i < taskCount; i++) {

    // Ignora tarefas com o flag "skipNextExecutionCheck" como true
    if (taskList[i].skipNextExecutionCheck) {
      continue;
    }

    int32_t timeToExecution = (int32_t)(taskList[i].executeTime - currentTime);

    if (timeToExecution < 0) {
      timeToExecution += taskList[i].interval;
    }

    if (timeToExecution < smallestTime) {
      smallestTime = timeToExecution;
    }
  }

  return smallestTime / 1000;
}
