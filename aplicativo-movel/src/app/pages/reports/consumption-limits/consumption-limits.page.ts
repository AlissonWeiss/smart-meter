import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonSelectOption, IonSelect, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { SqlFileReaderService } from 'src/app/services/sql-file-reader/sql-file-reader.service';
import { FiwareAPIService, QuantumLeapSQLEntity } from 'src/app/services/fiware-api/fiware-api.service';
import { ToastController, Platform } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { Device } from '@capacitor/device';


@Component({
  selector: 'app-consumption-limits',
  templateUrl: './consumption-limits.page.html',
  styleUrls: ['./consumption-limits.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonSelectOption, IonSelect, IonButton, IonSpinner]
})
export class ConsumptionLimitsPage {
  @ViewChild('barChart', { static: false }) barChart: any;
  chart: any;

  pageTitle: string = '';
  showEyeButton: boolean = true;
  reportType: string = '';
  isLoading: boolean = false;
  mySmartMeters: { id: string, name: string }[] = [];
  selectedSmartMeters: string[] = [];

  dailyConsumptionLimit: number = -1;
  weeklyConsumptionLimit: number = -1;
  monthlyConsumptionLimit: number = -1;

  totalConsumption: number = 0;
  devices: any[] = [];

  private deviceId: string | null = null;

  constructor(
    private sqlFileReaderService: SqlFileReaderService,
    private fiwareApiService: FiwareAPIService,
    private toastController: ToastController,
    private platform: Platform
  ) {
    this.pageTitle = 'Relatório - Limites de consumo';
    this.loadMySmartMeters();
    Chart.register(...registerables);

    this.platform.ready().then(async () => {
      const deviceId = await Device.getId();
      console.log('Device ID:', deviceId);
      this.deviceId = deviceId.identifier;
      this.updateMyConsumptionLimits(this.deviceId);
    });
  }

  updateMyConsumptionLimits(deviceId: string) {
    console.log("🚀 ~ ConsumptionLimitsPage ~ updateMyConsumptionLimits ~ deviceId:", deviceId)
    this.fiwareApiService.getMyConfigurations(deviceId).subscribe(i => {
      console.log("🚀 ~ ConsumptionLimitsPage ~ this.fiwareApiService.getMyConfigurations ~ i:", i)
      this.dailyConsumptionLimit = i.dailyEnergyLimit;
      this.weeklyConsumptionLimit = i.weeklyEnergyLimit;
      this.monthlyConsumptionLimit = i.monthlyEnergyLimit;
    });
  }

  ionViewDidEnter() {
    this.createBarChart();
  }

  async search() {
    this.isLoading = true;

    try {
      const isValid = await this.validateFields();
      if (!isValid) {
        this.isLoading = false;
        return;
      }

      const content = await this.getSQLFormattedFileContentByReportType();
      this.executeAndFillConsumptionData(content);

    } catch (error) {
      console.log("🚀 ~ ConsumptionReportPage ~ search ~ error:", error);
    } finally {
      this.isLoading = false;
    }
  }

  async getSQLFormattedFileContentByReportType(): Promise<string> {

    if (this.reportType === 'by_week') {
      const fileContent = await firstValueFrom(
        this.sqlFileReaderService.getConsumptionByWeekFileContent()
      );
      return this.formatSqlToExecuteOnFiware(fileContent);
    }

    if (this.reportType === 'by_month') {
      const fileContent = await firstValueFrom(
        this.sqlFileReaderService.getConsumptionByMonthFileContent()
      );
      return this.formatSqlToExecuteOnFiware(fileContent);
    }

    if (this.reportType === 'by_year') {
      const fileContent = await firstValueFrom(
        this.sqlFileReaderService.getConsumptionByYearFileContent()
      );
      return this.formatSqlToExecuteOnFiware(fileContent);
    }

    throw new Error('Unsupported report type');
  }


  private formatSqlToExecuteOnFiware(content: string): any {
    const inFormatted = `(${this.selectedSmartMeters.map(str => `'${str}'`).join(', ')})`
    content = content.replace("$1", inFormatted)
    const contract = {
      stmt: content
    };

    return contract;
  }

  async executeAndFillConsumptionData(body: string) {
    try {
      const data: QuantumLeapSQLEntity = await firstValueFrom(
        this.fiwareApiService.executeQuantumLeapQuery(body)
      );

      if (data) {
        this.formatDataChartAndCalculateItens(data);
        console.log("Successfully recovered QuantumLeap SQL.");
      } else {
        console.warn("No data returned from QuantumLeap SQL query.");
      }
    } catch (error) {
      console.error('Error fetching QuantumLeap SQL', error);
    }
  }

  formatDataChartAndCalculateItens(data: QuantumLeapSQLEntity) {
    console.log("🚀 ~ ConsumptionReportPage ~ formatDataChartAndCalculateItens ~ data:", data);
    this.updateChartData(data);
  }

  async validateFields(): Promise<boolean> {

    if (!this.reportType) {
      await this.showToast('É necessário preencher o tipo de relatório desejado', 'warning');
      return false;
    }

    if (!this.selectedSmartMeters || this.selectedSmartMeters.length === 0) {
      await this.showToast('Por favor, selecione pelo menos um SmartMeter', 'warning');
      return false;
    }

    return true;
  }

  createBarChart() {

    if (this.chart) {
      // Se existir algum gráfico, ele é destruído para não afetar o novo
      this.chart.destroy();
    }

    const customLabelsPlugin = {
      id: 'customLabels',
      afterDraw: (chart: any) => {
        const { ctx, chartArea: { top, right } } = chart;

        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(54, 162, 235, 1)';
        ctx.textAlign = 'right';

        ctx.fillText(`Limite Diário: ${this.dailyConsumptionLimit}`, right - 10, top + 20);
        ctx.fillText(`Limite Semanal: ${this.weeklyConsumptionLimit}`, right - 10, top + 40);
        ctx.fillText(`Limite Mensal: ${this.monthlyConsumptionLimit}`, right - 10, top + 60);
      }
    };

    const labels = this.devices.map(device => device.id); // IDs dos dispositivos
    const data = this.devices.map(device => device.consumption); // Consumos

    this.chart = new Chart(this.barChart.nativeElement, {
      type: 'bar',
      data: {
        labels: labels, // IDs dos dispositivos como labels
        datasets: [{
          label: 'Consumo (kW)',
          data: data, // Dados de consumo
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        responsive: true
      },
      plugins: [customLabelsPlugin]
    });
  }

  updateChartData(data: QuantumLeapSQLEntity) {
    if (this.chart) {
      const measuredAtIndex = data.cols.indexOf('measuredattext');
      const energyIndex = data.cols.indexOf('energy');

      const labels: string[] = [];
      const values: number[] = [];
      const colors: string[] = []; // Array para cores das barras

      for (let i = 1; i < data.rows.length; i++) {
        const currentRow = data.rows[i];
        const previousRow = data.rows[i - 1];

        const currentDate = this.formatToFriendlyDate(currentRow[measuredAtIndex]);
        const currentEnergy = currentRow[energyIndex];
        const previousEnergy = previousRow[energyIndex];

        const consumptionPeriod = currentEnergy - previousEnergy;
        labels.push(currentDate);
        values.push(consumptionPeriod);

        if (this.reportType === "by_week" && this.comparePeriodAndConsumption(this.dailyConsumptionLimit, consumptionPeriod)) {
          colors.push("red"); // Ultrapassou o limite diário
        } else if (this.reportType === "by_month" && this.comparePeriodAndConsumption(this.weeklyConsumptionLimit, consumptionPeriod)) {
          colors.push("red"); // Ultrapassou o limite semanal
        } else if (this.reportType === "by_year" && this.comparePeriodAndConsumption(this.monthlyConsumptionLimit, consumptionPeriod)) {
          colors.push("red"); // Ultrapassou o limite mensal
        } else {
          colors.push("blue"); // Dentro do limite
        }
      }

      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.data.datasets[0].backgroundColor = colors;
      this.chart.update();
    }
  }

  comparePeriodAndConsumption(limit: number, consumption: number): boolean {
    return limit > -1 && consumption > limit;
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

  formatToFriendlyDate(dateString: string) {
    const date = new Date(dateString);

    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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