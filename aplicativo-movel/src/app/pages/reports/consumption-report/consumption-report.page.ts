import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonSelectOption, IonSelect, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { SqlFileReaderService } from 'src/app/services/sql-file-reader/sql-file-reader.service';
import { FiwareAPIService, QuantumLeapSQLEntity } from 'src/app/services/fiware-api/fiware-api.service';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-consumption-report',
  templateUrl: './consumption-report.page.html',
  styleUrls: ['./consumption-report.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonSelectOption, IonSelect, IonButton, IonSpinner]
})
export class ConsumptionReportPage {
  @ViewChild('barChart', { static: false }) barChart: any;
  chart: any;

  pageTitle: string = '';
  showEyeButton: boolean = true;
  reportType: string = '';
  selectedViewMode: string = '';
  isLoading: boolean = false;
  mySmartMeters: { id: string, name: string }[] = [];
  selectedSmartMeters: string[] = [];

  totalConsumption: number = 0;
  devices: any[] = [];

  constructor(
    private sqlFileReaderService: SqlFileReaderService,
    private fiwareApiService: FiwareAPIService,
    private toastController: ToastController
  ) {
    this.pageTitle = 'Relatório - Consumo';
    this.loadMySmartMeters();
    Chart.register(...registerables);
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
    if (this.reportType === 'by_hour') {
      const fileContent = await firstValueFrom(
        this.sqlFileReaderService.getConsumptionByHourFileContent()
      );
      return this.formatSqlToExecuteOnFiware(fileContent);
    }

    if (this.reportType === 'by_day') {
      const fileContent = await firstValueFrom(
        this.sqlFileReaderService.getConsumptionByDayFileContent()
      );
      return this.formatSqlToExecuteOnFiware(fileContent);
    }

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

    if (this.reportType === 'total') {
      const fileContent = await firstValueFrom(
        this.sqlFileReaderService.getConsumptionTotalFileContent()
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
    this.calculateTotalConsumption(data);
    this.updateConsumptionByDevice(data);
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

    if (!this.selectedViewMode) {
      await this.showToast('É necessário preencher o tipo de visualização desejado', 'warning');
      return false;
    }

    return true;
  }

  calculateTotalConsumption(data: QuantumLeapSQLEntity) {
    const smartMeterIndex = data.cols.indexOf('refsmartmeter');
    const measuredAtIndex = data.cols.indexOf('measuredat');
    const energyIndex = data.cols.indexOf('energy');

    if (smartMeterIndex === -1 || measuredAtIndex === -1 || energyIndex === -1) {
      console.error("Required columns not found in data.");
      return;
    }

    // Agrupar leituras por refsmartmeter
    const readingsByMeter: { [key: string]: any[] } = data.rows.reduce((acc, row) => {
      const smartMeterId = row[smartMeterIndex];
      const measuredAt = row[measuredAtIndex];

      if (!acc[smartMeterId]) {
        acc[smartMeterId] = [];
      }

      acc[smartMeterId].push(row); // Adiciona a leitura na lista do smartMeterId
      return acc;
    }, {});

    // Calcular o consumo para cada smart meter
    this.totalConsumption = Object.values(readingsByMeter).reduce((total: number, readings: any[]) => {
      // Ordena as leituras pelo tempo (measuredat) do menor para o maior
      readings.sort((a, b) => a[measuredAtIndex] - b[measuredAtIndex]);

      const firstReading = readings[0]; // Primeira leitura (menor measuredat)
      const lastReading = readings[readings.length - 1]; // Última leitura (maior measuredat)

      const energyConsumed = lastReading[energyIndex] - firstReading[energyIndex];

      return total + energyConsumed; // Soma o consumo de cada smart meter ao total
    }, 0);

    console.log("Total consumption for the period calculated:", this.totalConsumption);
  }


  updateConsumptionByDevice(data: QuantumLeapSQLEntity) {
    const smartMeterIndex = data.cols.indexOf('refsmartmeter');
    const measuredAtIndex = data.cols.indexOf('measuredat');
    const energyIndex = data.cols.indexOf('energy');

    if (smartMeterIndex === -1 || measuredAtIndex === -1 || energyIndex === -1) {
      console.error("Required columns not found in data.");
      return;
    }

    // Agrupar leituras por refsmartmeter
    const readingsByMeter: { [key: string]: any[] } = data.rows.reduce((acc, row) => {
      const smartMeterId = row[smartMeterIndex];

      if (!acc[smartMeterId]) {
        acc[smartMeterId] = [];
      }

      acc[smartMeterId].push(row); // Adiciona a leitura na lista do smartMeterId
      return acc;
    }, {});

    // Atualizar a lista de devices com os consumos calculados
    this.devices = Object.entries(readingsByMeter).map(([meterId, readings]: [string, any[]]) => {
      // Ordenar as leituras pelo tempo (measuredat)
      readings.sort((a, b) => a[measuredAtIndex] - b[measuredAtIndex]);

      const firstReading = readings[0]; // Primeira leitura
      const lastReading = readings[readings.length - 1]; // Última leitura

      // Calcular o consumo no período
      const consumption = lastReading[energyIndex] - firstReading[energyIndex];

      // Procurar o nome correspondente ao meterId em `mySmartMeters`
      const smartMeter = this.mySmartMeters.find(meter => meter.id === meterId);
      const deviceName = smartMeter ? smartMeter.name : 'Unknown Device';

      return {
        id: meterId,
        name: deviceName,
        consumption: consumption
      };
    });

    console.log("Devices updated with consumption data:", this.devices);
  }

  createBarChart() {

    if (this.chart) {
      this.chart.destroy(); // Destrói o gráfico existente
    }

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
        }
      }
    });
  }

  updateChartData(data: QuantumLeapSQLEntity) {
    if (this.chart) {
      const measuredAtIndex = data.cols.indexOf('measuredattext');
      const energyIndex = data.cols.indexOf('energy');

      const labels: string[] = [];
      const values: number[] = [];

      if (this.selectedViewMode === 'accumulated') {
        data.rows.forEach((item) => {
          const measuredAt = this.formatDateWithReportType(item[measuredAtIndex]);
          const energy = item[energyIndex];

          const existingLabelIndex = labels.indexOf(measuredAt);
          if (existingLabelIndex !== -1) {
            values[existingLabelIndex] += energy;
          } else {
            labels.push(measuredAt);
            values.push(energy);
          }
        });
      } else if (this.selectedViewMode === 'period') {
        for (let i = 1; i < data.rows.length; i++) {
          const currentRow = data.rows[i];
          const previousRow = data.rows[i - 1];

          const measuredAt = this.formatDateWithReportType(currentRow[measuredAtIndex]);
          const currentEnergy = currentRow[energyIndex];
          const previousEnergy = previousRow[energyIndex];

          const consumptionPeriod = currentEnergy - previousEnergy;

          if (consumptionPeriod < 0) {
            // Se consumo for menor que 0, significa que o periodo ainda não está completo e pode apresentar dados inválidos
            continue
          }

          labels.push(measuredAt);
          values.push(consumptionPeriod);
        }
      }

      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.update();
    }
  }

  formatDateWithReportType(dateString: string): string {
    const date = new Date(dateString);

    switch (this.reportType) {
      case 'by_hour':
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      case 'by_week':
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

      case 'by_month':
        // Encontrar o primeiro dia da semana (domingo)
        const startOfWeek = new Date(date);
        const dayOfWeek = startOfWeek.getDay(); // Retorna o dia da semana (0 = domingo, 1 = segunda-feira, ..., 6 = sábado)
        startOfWeek.setDate(date.getDate() - dayOfWeek);  // Ajusta a data para o domingo da semana

        // Encontrar o último dia da semana (sábado)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Adiciona 6 dias ao domingo para obter o sábado

        return `${startOfWeek.getDate().toString().padStart(2, '0')}/${(startOfWeek.getMonth() + 1).toString().padStart(2, '0')}/${startOfWeek.getFullYear()} a ${endOfWeek.getDate().toString().padStart(2, '0')}/${(endOfWeek.getMonth() + 1).toString().padStart(2, '0')}/${endOfWeek.getFullYear()}`;

      case 'by_year':
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

      case 'total':
        return `Ano: ${date.getFullYear()}`;

      default:
        throw new Error('Invalid reportType');
    }
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

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}