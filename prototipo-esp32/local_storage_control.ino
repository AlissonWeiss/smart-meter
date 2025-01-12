#include "FS.h"
#include <LittleFS.h>

// Se colocar como true e der erro ao montar o sistema, o LittleFS irá formatar o disco
#define FORMAT_LITTLEFS_IF_FAILED true

String consumeFilesPath = "/consumes";
String separator = "/";

String getFilePathAndName() {
  String fileName = getFormattedLocalTime();
  fileName.replace("T", "");
  fileName.replace("-", "");
  fileName.replace("Z", "");
  fileName.replace(":", "");
  fileName = fileName.substring(0, 12);

  return consumeFilesPath + separator + fileName + ".txt";
}

void saveConsumeOnLocalStorage(TEnergyConsumption consumption) {
  if (!isValidDateFormat(consumption.measuredAt)) {
    Serial.println("Invalid date format. Skipping save.");
    return;
  }
  
  String filePathAndName = getFilePathAndName();

  Serial.print("Saving consume into local storage. FileName = ");
  Serial.println(filePathAndName);

  // Abre o arquivo para escrita
  File file = LittleFS.open(filePathAndName, "a");

  if (!file) {
    Serial.println("There was an error opening the file for writing.");
    return;
  }
  char* stringConsume = consumption2StringLocalStorage(consumption);
  if (!file.print(stringConsume)) {
    Serial.println("Failed to write to file.");
  }

  file.close();
}

char* consumption2StringLocalStorage(TEnergyConsumption consumption) {
  char* result = (char*)malloc(300 * sizeof(char));
  sprintf(result, "%.3f;%.3f;%.3f;%.3f;%.3f;%.3f;%s\n",
          consumption.voltage, consumption.current, consumption.power, consumption.energy,
          consumption.frequency, consumption.pf, consumption.measuredAt);
  return result;
}

TEnergyConsumption stringLocalStorage2Consumption(const char* str) {
  TEnergyConsumption consumption;

  sscanf(str, "%f;%f;%f;%f;%f;%f;%s",
         &consumption.voltage, &consumption.current, &consumption.power, &consumption.energy,
         &consumption.frequency, &consumption.pf, consumption.measuredAt);

  return consumption;
}

bool startFileSystem() {

  if (!LittleFS.begin(FORMAT_LITTLEFS_IF_FAILED)) {
    Serial.println("LittleFS mount failed!");
    return false;
  }

  Serial.println("LittleFS mounted.");

  uint16_t ttbytes = LittleFS.totalBytes() / 1024;
  Serial.printf("Total bytes: %dKB\n", ttbytes);

  uint16_t ttbytes_used = LittleFS.usedBytes() / 1024;
  Serial.printf("Total used bytes: %dKB\n", ttbytes_used);

  return true;
}

void createDir(String path) {
  Serial.printf("Creating Dir: %s\n", path);

  if (LittleFS.exists(path)) {
    Serial.println("Directory already exists.");
    return;
  }

  if (LittleFS.mkdir(path)) {
    Serial.println("Dir created");
  } else {
    Serial.println("mkdir failed");
  }
}

void initSystemFiles(bool clearLocalFiles) {
  createDir(consumeFilesPath);

  if (clearLocalFiles) {
    removeDirectoryRecursively(consumeFilesPath);
  }
  listDir(consumeFilesPath);
}

void removeFileByName(String dirname, String filename) {
  String fullPath = dirname + separator + filename;
  Serial.printf("Removing file: %s\n", fullPath.c_str());

  if (LittleFS.remove(fullPath)) {
    Serial.println("File removed successfully");
  } else {
    Serial.println("Failed to remove file");
  }
}

void listDir(String dirname) {
  Serial.printf("Listing directory: %s\n", dirname);

  File root = LittleFS.open(dirname);
  if (!root) {
    Serial.println("Failed to open directory");
    return;
  }
  if (!root.isDirectory()) {
    Serial.println("Not a directory");
    return;
  }

  File file = root.openNextFile();
  while (file) {
    if (file.isDirectory()) {
      Serial.print("  DIR : ");
      Serial.println(file.name());
    } else {
      Serial.print("  FILE: ");
      Serial.println(file.name());
    }
    file = root.openNextFile();
  }
  Serial.println();
}

void removeDirectoryRecursively(String dirname) {
  File root = LittleFS.open(dirname);
  if (!root) {
    Serial.println("Failed to open directory");
    return;
  }
  if (!root.isDirectory()) {
    Serial.println("Not a directory");
    root.close();  // Correção: Fechamento do arquivo/diretório antes do retorno.
    return;
  }

  File file = root.openNextFile();
  while (file) {
    String filename = file.name();
    String fullPath = dirname + separator + filename;  // Correção: Constrói o caminho completo corretamente.
    if (file.isDirectory()) {
      // Recursivamente remove subdiretórios
      file.close();  // Correção: Fechar o diretório antes da chamada recursiva.
      removeDirectoryRecursively(fullPath);
      root = LittleFS.open(dirname);  // Reabre o diretório após retornar da chamada recursiva.
    } else {
      file.close();  // Correção: Fechar o arquivo antes da remoção.
      removeFileByName(dirname, filename);
    }
    file = root.openNextFile();
  }
  root.close();  // Correção: Fechar o diretório após processar todos os arquivos.
}

int countFilesInDirectory(const char* dirname) {
  int fileCount = 0;

  File dir = LittleFS.open(dirname);
  if (!dir) {
    Serial.printf("Erro ao abrir o diretório: %s\n", dirname);
    return -1;
  }
  if (!dir.isDirectory()) {
    Serial.printf("Não é um diretório: %s\n", dirname);
    dir.close();
    return -1;
  }

  File file = dir.openNextFile();
  while (file) {
    if (!file.isDirectory()) {  // Conta apenas arquivos, não subdiretórios
      fileCount++;
    }
    file.close();
    file = dir.openNextFile();
  }

  dir.close();
  return fileCount;
}

void sendConsumeDataSavedLocally() {
  if (!isWifiConnected()) {
    Serial.println("WiFi not connected. Cannot send FIWARE data now.");
    return;
  }
  if (!isFiwareHealth()) {
    Serial.println("FIWARE is no available right now. Cannot send FIWARE data now.");
    return;
  }

  File root = LittleFS.open(consumeFilesPath);
  if (!root) {
    Serial.println("Failed to open directory");
    return;
  }
  if (!root.isDirectory()) {
    Serial.println("Not a directory");
    root.close();
    return;
  }

  File file = root.openNextFile();
  while (file) {
    if (!file.isDirectory()) {
      bool fileSentWithSuccess = true;
      String filename = file.name();
      Serial.print("Sending content of local file to FIWARE. File = ");
      Serial.println(filename);
      
      // Lê o arquivo linha por linha
      while (file.available()) {
        String line = file.readStringUntil('\n');
        line.trim();  // Remove quaisquer caracteres de nova linha ou retorno de carro
        Serial.println(line);
        TEnergyConsumption consumption = stringLocalStorage2Consumption(line.c_str());
        if (!isValidDateFormat(consumption.measuredAt)) {
          Serial.println("Invalid date format. Skipping line.");
          continue;
        }
        String consumeJson = generateConsumeJson(consumption);
        bool result = saveConsumeIntoFiware(consumeJson);
        if (!result) {
          Serial.println("Error trying to send file content to FIWARE.");
          fileSentWithSuccess = false;
          break;  // Interrompe a leitura se ocorrer falha ao enviar
        }
      }
      file.close();

      // Remove o arquivo se foi enviado com sucesso
      if (fileSentWithSuccess) {
        removeFileByName(consumeFilesPath, filename);
      } else {
        break;
      }
    }
    file = root.openNextFile();
  }
  root.close();
  Serial.println("End process of sent local data do FIWARE.");
}

bool isValidDateFormat(const char* date) {
  // Verifica se o comprimento é 20 para o formato "YYYY-MM-DDTHH:MM:SSZ"
  if (strlen(date) != 20) return false;
  if (date[4] != '-' || date[7] != '-' || date[10] != 'T' || date[13] != ':' || date[16] != ':' || date[19] != 'Z') return false;

  int year = atoi(String(date).substring(0, 4).c_str());
  int month = atoi(String(date).substring(5, 7).c_str());
  int day = atoi(String(date).substring(8, 10).c_str());
  int hour = atoi(String(date).substring(11, 13).c_str());
  int minute = atoi(String(date).substring(14, 16).c_str());
  int second = atoi(String(date).substring(17, 19).c_str());

  if (year < 1970 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return false;
  }

  return true;
}

bool hasFilesInFolder(const char* folderPath) {
  File root = LittleFS.open(folderPath);
  if (!root) {
    Serial.println("Failed to open directory");
    return false;
  }
  if (!root.isDirectory()) {
    Serial.println("Not a directory");
    root.close();
    return false;
  }

  File file = root.openNextFile();
  bool hasFiles = (file) ? true : false;  // Verifica se existe pelo menos um arquivo

  root.close();
  return hasFiles;
}

bool hasConsumeFilesToSend() {
  return hasFilesInFolder(consumeFilesPath.c_str());
}

int countOfFilesPendingFIWARESend() {
  return countFilesInDirectory(consumeFilesPath.c_str());
}