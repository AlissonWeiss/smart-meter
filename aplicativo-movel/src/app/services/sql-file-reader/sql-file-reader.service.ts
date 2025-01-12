import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqlFileReaderService {

  constructor(private httpClient: HttpClient) { }

  getConsumptionByHourFileContent(): Observable<string> {
    var filename = "assets/sql/consumption/by_hour.sql"

    return this.readSqlFile(filename);
  }

  getConsumptionByDayFileContent(): Observable<string> {
    var filename = "assets/sql/consumption/by_day.sql"

    return this.readSqlFile(filename);
  }

  getConsumptionByWeekFileContent(): Observable<string> {
    var filename = "assets/sql/consumption/by_week.sql"

    return this.readSqlFile(filename);
  }

  getConsumptionByMonthFileContent(): Observable<string> {
    var filename = "assets/sql/consumption/by_month.sql"

    return this.readSqlFile(filename);
  }

  getConsumptionByYearFileContent(): Observable<string> {
    var filename = "assets/sql/consumption/by_year.sql"

    return this.readSqlFile(filename);
  }

  getConsumptionTotalFileContent(): Observable<string> {
    var filename = "assets/sql/consumption/total.sql"

    return this.readSqlFile(filename);
  }

  getLackOfEnergyFileContent(): Observable<string> {
    var filename = "assets/sql/lack_of_energy.sql"

    return this.readSqlFile(filename);
  }


  getComparisonByHourLast7DaysFileContent(): Observable<string> {
    var filename = "assets/sql/compare-consumption/by_hour_last_7_days.sql"

    return this.readSqlFile(filename);
  }

  getComparisonByDayLast30DaysFileContent(): Observable<string> {
    var filename = "assets/sql/compare-consumption/by_day_of_month_last_30_days.sql"

    return this.readSqlFile(filename);
  }

  getComparisonByWeekLast90DaysFileContent(): Observable<string> {
    var filename = "assets/sql/compare-consumption/by_week_of_month_last_90_days.sql"

    return this.readSqlFile(filename);
  }

  getComparisonByMonthLast3YearsFileContent(): Observable<string> {
    var filename = "assets/sql/compare-consumption/by_month_last_3_years.sql"

    return this.readSqlFile(filename);
  }

  getConsumptionLimitsExceededFileContent(): Observable<string> {
    var filename = "assets/sql/background/consumption_exceeded.sql"

    return this.readSqlFile(filename);
  }

  getMonthlyCostFileContent(): Observable<string> {
    var filename = "assets/sql/monthly_consumption_cost.sql"

    return this.readSqlFile(filename);
  }

  private readSqlFile(fileName: string): Observable<string> {
    return this.httpClient.get(fileName, { responseType: 'text' });
  }
}
