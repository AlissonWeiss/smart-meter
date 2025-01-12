import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonSelectOption, IonSelect, IonButton,
  IonSpinner, IonDatetime, IonDatetimeButton, IonModal, IonIcon, IonToast
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, today } from 'ionicons/icons';
import { SqlFileReaderService } from 'src/app/services/sql-file-reader/sql-file-reader.service';
import { FiwareAPIService, MonthlyCost, MyConfigurations, QuantumLeapSQLEntity } from 'src/app/services/fiware-api/fiware-api.service';
import { ToastController, Platform } from '@ionic/angular';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-monthly-cost-report',
  templateUrl: './monthly-cost-report.page.html',
  styleUrls: ['./monthly-cost-report.page.scss'],
  standalone: true,
  providers: [ToastController],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
    IonSelectOption, IonSelect, IonButton, IonSpinner, IonDatetime, IonDatetimeButton, IonModal, IonIcon, IonToast
  ]
})
export class MonthlyCostReportPage implements OnInit {

  pageTitle: string = 'Gasto mensal';
  deviceId: string = '';
  firstMonthDay: string = '01';
  isLoading: boolean = false;
  showEyeButton: boolean = true;

  monthYearPicker: string = '';
  selectedMonthYear: string = '';

  mySmartMeters: { id: string, name: string }[] = [];
  selectedSmartMeters: string[] = [];
  filteredData: MonthlyCost[] = [];

  constructor(
    private platform: Platform,
    private sqlFileReaderService: SqlFileReaderService,
    private fiwareApiService: FiwareAPIService,
    private toastController: ToastController
  ) {
    addIcons({ eyeOffOutline, eyeOutline });
  }

  ngOnInit() {
    this.selectedMonthYear = this.getCurrentYearAndMonth();
    this.loadMySmartMeters();
    this.loadMyConfigurations();
  }

  async validateFields(): Promise<boolean> {
    if (!this.selectedMonthYear) {
      await this.showToast('Por favor selecione o mês que você deseja verificar os custos', 'warning');
      return false;
    }

    if (!this.selectedSmartMeters || this.selectedSmartMeters.length === 0) {
      await this.showToast('Por favor, selecione pelo menos um SmartMeter', 'warning');
      return false;
    }

    return true;
  }


  loadMyConfigurations() {
    this.platform.ready().then(async () => {
      const deviceId = await Device.getId();
      console.log('Device ID:', deviceId);
      this.deviceId = deviceId.identifier;
      console.log("🚀 ~ HomePage ~ this.platform.ready ~ this.deviceId:", this.deviceId);

      this.fiwareApiService.getMyConfigurations(this.deviceId).subscribe(
        (loadedConfigs: MyConfigurations) => {
          this.firstMonthDay = loadedConfigs.firstMonthDay;
          console.log("🚀 ~ MonthlyCostReportPage ~ this.platform.ready ~ loadedConfigs.firstMonthDay:", loadedConfigs.firstMonthDay)
        }
      );
    });
  }

  search() {
    this.isLoading = true;

    this.validateFields().then(
      (result) => {
        if (!result) {
          this.isLoading = false;
          return;
        }
        else {
          this.sqlFileReaderService.getMonthlyCostFileContent().subscribe(
            (content) => {
              this.executeAndFillListOfMonthlyCost(this.formatSqlToExecuteOnFiware(content));
              this.isLoading = false;
            },
            (error) => {
              console.log("LackOfEnergyPage ~ buscarFalhas ~ error:", error);
              this.isLoading = false;
            }
          );
        }
      }
    );
  }
  executeAndFillListOfMonthlyCost(body: string) {
    this.fiwareApiService.executeQuantumLeapQuery(body).subscribe(
      {
        next: (data: QuantumLeapSQLEntity) => {
          if (data) {
            this.formatDataToList(data);
            console.log("Successfully recovered QuantumLeap SQL.");
          }
        },
        error: (error) => {
          console.error('Error fetching QuantumLeap SQL', error);
        },
        complete: () => console.log('QuantumLeap SQL fetched successfully')
      }
    );
  }

  private formatDataToList(data: QuantumLeapSQLEntity) {

    this.filteredData = [];

    if (data.rows.length === 0) {
      const consumptionCost: MonthlyCost = {
        consumption_date: new Date(),
        consumption: 0,
        price: 0,
        total_value: 0
      }

      this.filteredData.push(consumptionCost);

      return;
    }

    data.rows.forEach(item => {

      const consumptionCost: MonthlyCost = {
        consumption_date: new Date(item[0]),
        consumption: item[1],
        price: item[2],
        total_value: item[3]
      }

      this.filteredData.push(consumptionCost);
    });
  }

  getTotalConsumption(): number {
    return this.filteredData.reduce((sum, item) => sum + item.consumption, 0);
  }

  getAveragePrice(): number {
    const totalPrice = this.filteredData.reduce((sum, item) => sum + item.price, 0);
    return totalPrice / this.filteredData.length || 0;
  }

  getTotalValue(): number {
    return this.filteredData.reduce((sum, item) => sum + item.total_value, 0);
  }

  getAverageTotalValue(): number {
    const totalValue = this.getTotalValue();
    return totalValue / this.filteredData.length || 0;
  }

  getConsumptionAverage(): number {
    const totalValue = this.getTotalConsumption();
    return totalValue / this.filteredData.length || 0;
  }

  onMonthYearChange(event: any) {
    this.selectedMonthYear = event.detail.value;
    console.log('Mês/Ano selecionado:', this.selectedMonthYear);
  }

  loadMySmartMeters() {
    var smartMeters = localStorage.getItem('savedSmartMeters');
    if (smartMeters == null) {
      return;
    }

    var jsonSmartMeters = JSON.parse(smartMeters);
    this.mySmartMeters = jsonSmartMeters.map((meter: any) => {
      return {
        id: meter.id,
        name: meter.name
      };
    });
  }

  getCurrentYearAndMonth(): string {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Adiciona zero à esquerda se necessário
    const currentYear = currentDate.getFullYear().toString();

    return `${currentYear}-${currentMonth}`;
  }

  getFromDate(): string {
    var strDate = `${this.selectedMonthYear}-${this.firstMonthDay}`;
    console.log("🚀 ~ MonthlyCostReportPage ~ getFromDate ~ strDate:", strDate);
    return `'${strDate}'`;
  }

  getEndDate(): string {
    var toDate = new Date(this.getFromDate());
    toDate.setMonth(toDate.getMonth() + 1);
    var strDate = this.formatDateToYYYYMMDD(toDate);
    console.log("🚀 ~ MonthlyCostReportPage ~ getEndDate ~ strDate:", strDate)
    return `'${strDate}'`;
  }

  formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    // Janeiro é igual a 0, então se eu fizer setMonth eu preciso dar get e somar mais 1, caso contrario, em janeiro, ficará com mês 0 na string
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatSqlToExecuteOnFiware(content: string): any {
    var from_date = this.getFromDate();
    content = content.replace("$1", from_date);
    const to_date = this.getEndDate();
    content = content.replace("$2", to_date);
    const inFormatted = `(${this.selectedSmartMeters.map(str => `'${str}'`).join(', ')})`;
    content = content.replace("$3", inFormatted);
    const contract = {
      stmt: content
    };

    return contract;
  }

  toggleEyeButton() {
    this.showEyeButton = !this.showEyeButton;
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}
