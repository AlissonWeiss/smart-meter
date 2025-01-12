#include "time.h"
#include "sntp.h"
#include "RTClib.h"
#include <Wire.h>

RTC_DS3231 rtc;

const char* ntpServer1 = "pool.ntp.org";
const char* ntpServer2 = "time.nist.gov";

String getFormattedLocalTime() {
  DateTime now = rtc.now();
  char buffer[30];
  snprintf(buffer, sizeof(buffer), "%04d-%02d-%02dT%02d:%02d:%02dZ",
           now.year(), now.month(), now.day(),
           now.hour(), now.minute(), now.second());
  return buffer;
}

String getFriendlyFormattedLocalTime() {
  DateTime now = rtc.now();

  // Ajusta o fuso horário para UTC-3 (Brasil)
  now = now + TimeSpan(0, -3, 0, 0);  // Subtrai 3 horas

  char buffer[20];
  snprintf(buffer, sizeof(buffer), "%02d/%02d/%04d %02d:%02d:%02d",
           now.day(), now.month(), now.year(),
           now.hour(), now.minute(), now.second());
  
  return String(buffer);
}

void updateExternalRTCDateTime() {

  struct tm timeinfo;
  while(!getLocalTime(&timeinfo)) {
    Serial.println("No time available (yet)");
    delay(1000);
  }

  rtc.adjust(DateTime(timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday, 
                        timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec));
}

// Função de callback chamada quando retornado dados via NTP
void ntpCallback(struct timeval* t) {
  Serial.println("Got time adjustment from NTP!");
  updateExternalRTCDateTime();
}

void updateMicrocontrollerInternalRTC() {
  DateTime now = rtc.now();

  tm timeinfo;
  timeinfo.tm_year = now.year() - 1900;
  timeinfo.tm_mon = now.month() - 1;
  timeinfo.tm_mday = now.day();
  timeinfo.tm_hour = now.hour();
  timeinfo.tm_min = now.minute();
  timeinfo.tm_sec = now.second();

  time_t t = mktime(&timeinfo);

  struct timeval now_tv;
  now_tv.tv_sec = t;
  now_tv.tv_usec = 0;
  settimeofday(&now_tv, NULL);

  struct tm timeinfo_esp;
  if (!getLocalTime(&timeinfo_esp)) {
    Serial.println("Failed to obtain time");
    return;
  }
  Serial.println(&timeinfo_esp, "%A, %B %d %Y %H:%M:%S");
}

void initiateDateTimeUtils() {
  Wire.begin();

  while (!rtc.begin()) {
    Serial.println("Couldn't find RTC");
    delay(1000);
  }

  if (rtc.lostPower()) {
    Serial.println("RTC lost power, need to synchronize with NTP server.");
    
    sntp_set_time_sync_notification_cb(ntpCallback);
    configTime(0, 0, ntpServer1, ntpServer2);
  }
  else{
    Serial.println("RTC is synchronized. No need to get datetime from NTP server.");
  }

  updateMicrocontrollerInternalRTC();
}
