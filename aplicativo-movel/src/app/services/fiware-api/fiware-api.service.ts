import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface MyConfigurations {
  fiwareHost: string;
  fiwareOrionPort: number;
  fiwareQuantumLeapPort: number;
  crateDBPort: number;
  isNotificationsAllowed: boolean;
  dailyEnergyLimit: number;
  weeklyEnergyLimit: number;
  monthlyEnergyLimit: number;
  timeForBackgroundUpdate: number;
  firstMonthDay: string;
}

export interface SmartMeter {
  id: string;
  type: string;
  name: string;
}

export interface QuantumLeapAttributes {
  attrName: string;
  values: string[];
}

export interface QuantumLeapAPIEntity {
  attributes: QuantumLeapAttributes[];
  entityId: string;
  entityType: string;
  index: Date[];
}

export interface ElectricalConsume {
  id: string;
  type: string;
  current: number;
  energy: number;
  frequency: number;
  measuredAt: Date;
  pf: number;
  power: number;
  refSmartMeter: string;
  voltage: number;
}

export interface QuantumLeapSQLEntity {
  cols: string[];
  rows: any[];
  rowCount: number;
  duration: number;
}

export interface LackOfEnergy {
  smart_meter_id: string;
  from_datetime: Date;
  to_datetime: Date;
  gap_in_seconds: number;
}

export interface MonthlyCost {
  consumption_date: Date;
  consumption: number;
  price: number;
  total_value: number;
}


const FIWARE_AND_JSON_HEADERS = new HttpHeaders({
  'Content-Type': 'application/json',
  'fiware-service': 'smart_meter',
  'fiware-servicepath': '/'
});

const ONLY_FIWARE_HEADERS = new HttpHeaders({
  'fiware-service': 'smart_meter',
  'fiware-servicepath': '/'
});

@Injectable({
  providedIn: 'root'
})
export class FiwareAPIService {

  private FIWARE_HOST = localStorage.getItem('fiwareHost') || '';
  private ORION_API_PORT = localStorage.getItem('fiwareOrionPort') || '11026';
  private QUANTUM_LEAP_API_PORT = localStorage.getItem('fiwareQuantumLeapPort') || '18668';
  private CRATE_DB_PORT = localStorage.getItem('crateDBPort') || '4200';
  private ENTITIES_PATH = 'v2/entities';
  private UPDATE_ENTITIES_URL = `${this.FIWARE_HOST}:${this.ORION_API_PORT}/v2/op/update`;

  constructor(private http: HttpClient) { }

  getSmartMeterById(smartMeterId: string): Observable<SmartMeter> {
    const url = `${this.FIWARE_HOST}:${this.ORION_API_PORT}/${this.ENTITIES_PATH}/${smartMeterId}?type=SmartMeter&options=keyValues`;
    return this.http.get<SmartMeter>(url, { headers: ONLY_FIWARE_HEADERS });
  }

  saveNewKilowattPrice(kilowattUpdatedPrice: number, kilowattEfectiveDate: Date): Observable<boolean> {
    console.log("🚀 ~ FiwareAPIService ~ saveNewKilowattPrice ~ kilowattEfectiveDate:", kilowattEfectiveDate)
    console.log("🚀 ~ FiwareAPIService ~ saveNewKilowattPrice ~ kilowattUpdatedPrice:", kilowattUpdatedPrice)
    const jsonPrice = {
      actionType: 'append',
      entities: [
        {
          id: 'KilowattPrice',
          type: 'KilowattPrice',
          price: {
            type: 'Float',
            value: kilowattUpdatedPrice
          },
          startDate: {
            type: 'DateTime',
            value: kilowattEfectiveDate
          }
        }
      ]
    };
    return this.updateEntities(jsonPrice);
  }

  getAllPrices(): Observable<QuantumLeapAPIEntity> {
    const url = `${this.FIWARE_HOST}:${this.QUANTUM_LEAP_API_PORT}/${this.ENTITIES_PATH}/KilowattPrice?attrs=price,startDate`;
    return this.http.get<QuantumLeapAPIEntity>(url, { headers: ONLY_FIWARE_HEADERS });
  }

  getCurrentElectricalConsumeBySmartMeter(smartMeterId: string): Observable<ElectricalConsume[]> {
    const url = `${this.FIWARE_HOST}:${this.ORION_API_PORT}/${this.ENTITIES_PATH}?options=keyValues&type=ElectricalConsume&q=refSmartMeter==${smartMeterId}`;
    return this.http.get<ElectricalConsume[]>(url, { headers: ONLY_FIWARE_HEADERS });
  }

  getEnergyAndPowerFromQuantumLeap(from: string, to: string): Observable<QuantumLeapSQLEntity> {
    const contract = {
      stmt: `SELECT t1.energy, t1.power, t1.measuredAt
             FROM mtsmart_meter.etelectricalconsume t1
             JOIN (SELECT measuredAt::date as day, MAX(measuredAt) as max_measuredAt
                   FROM mtsmart_meter.etelectricalconsume
                   WHERE measuredAt BETWEEN '${from}' AND '${to} 23:59:59'
                   GROUP BY measuredAt::date) t2
             ON t1.measuredAt::date = t2.day AND t1.measuredAt = t2.max_measuredAt
             ORDER BY t1.measuredAt`
    };
    const url = `${this.FIWARE_HOST}:${this.CRATE_DB_PORT}/_sql`;
    return this.http.post<QuantumLeapSQLEntity>(url, contract, { headers: FIWARE_AND_JSON_HEADERS });
  }

  getAllPricesFromQuantumLeap(from: string, to: string): Observable<QuantumLeapSQLEntity> {
    const sql = {
      stmt: `SELECT entity_id, entity_type, time_index, price, startdate, TO_CHAR(startdate at TIME zone 'America/Sao_Paulo', 'DD/MM/YYYY') as startdatetext
               FROM mtsmart_meter.etkilowattprice
              WHERE startdate::date between '${from}' AND '${to}' 
              ORDER BY startdate::date asc`
    }

    return this.executeQuantumLeapQuery(JSON.stringify(sql));
  }

  executeQuantumLeapQuery(contract: string): Observable<QuantumLeapSQLEntity> {
    const url = `${this.FIWARE_HOST}:${this.CRATE_DB_PORT}/_sql`;
    return this.http.post<QuantumLeapSQLEntity>(url, contract, { headers: FIWARE_AND_JSON_HEADERS });
  }

  updateSmartMeterAttr(smartMeterId: string, attrName: string, attrType: string, attrValue: string): Observable<boolean> {
    const url = `${this.FIWARE_HOST}:${this.ORION_API_PORT}/${this.ENTITIES_PATH}/${smartMeterId}/attrs?type=SmartMeter`;
    const body = {
      [attrName]: {
        type: attrType,
        value: attrValue
      }
    };
    return this.http.put(url, body, { headers: FIWARE_AND_JSON_HEADERS, observe: 'response' })
      .pipe(
        map(response => response.status === 204),
        catchError(error => {
          console.error('Error updating entities', error);
          return of(false);
        })
      );
  }

  getMyConfigurations(deviceId: string): Observable<MyConfigurations> {
    const entityId = `PersonalConfiguration_${deviceId}`;
    const url = `${this.FIWARE_HOST}:${this.ORION_API_PORT}/${this.ENTITIES_PATH}/${entityId}?type=PersonalConfiguration&options=keyValues`;
    return this.http.get<MyConfigurations>(url, { headers: ONLY_FIWARE_HEADERS });
  }

  saveMyConfigurations(deviceId: string, myConfigs: MyConfigurations) {
    const entityId = `PersonalConfiguration_${deviceId}`;

    console.log("🚀 ~ FiwareAPIService ~ saveMyConfigurations ~ entityId:", entityId);

    const jsonConfig = {
      actionType: 'append',
      entities: [
        {
          id: entityId,
          type: 'PersonalConfiguration',
          fiwareHost: {
            type: 'Text',
            value: myConfigs.fiwareHost
          },
          fiwareOrionPort: {
            type: 'Integer',
            value: myConfigs.fiwareOrionPort
          },
          fiwareQuantumLeapPort: {
            type: 'Integer',
            value: myConfigs.fiwareQuantumLeapPort
          },
          crateDBPort: {
            type: 'Integer',
            value: myConfigs.crateDBPort
          },
          isNotificationsAllowed: {
            type: 'Boolean',
            value: myConfigs.isNotificationsAllowed
          },
          dailyEnergyLimit: {
            type: 'Integer',
            value: myConfigs.dailyEnergyLimit
          },
          weeklyEnergyLimit: {
            type: 'Integer',
            value: myConfigs.weeklyEnergyLimit
          },
          monthlyEnergyLimit: {
            type: 'Float',
            value: myConfigs.monthlyEnergyLimit
          },
          timeForBackgroundUpdate: {
            type: 'Integer',
            value: myConfigs.timeForBackgroundUpdate
          },
          firstMonthDay: {
            type: 'Text',
            value: myConfigs.firstMonthDay
          }
        }
      ]
    };
    return this.updateEntities(jsonConfig);
  }

  private updateEntities(updateEntityContract: any): Observable<boolean> {
    console.log("🚀 ~ FiwareAPIService ~ updateEntities ~ updateEntityContract:", JSON.stringify(updateEntityContract));
    console.log("🚀 ~ FiwareAPIService ~ updateEntities ~ this.UPDATE_ENTITIES_URL:", this.UPDATE_ENTITIES_URL)
    return this.http.post(this.UPDATE_ENTITIES_URL, JSON.stringify(updateEntityContract), { headers: FIWARE_AND_JSON_HEADERS, observe: 'response' })
      .pipe(
        map(response => response.status === 204),
        catchError(error => {
          console.error('Error updating entities', error);
          return of(false);
        })
      );
  }
}
