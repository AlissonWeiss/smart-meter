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
  selector: 'app-compare-consumption',
  templateUrl: './compare-consumption.page.html',
  styleUrls: ['./compare-consumption.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonButton, IonMenuButton, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonSelectOption, IonSelect, IonSpinner]
})
export class CompareConsumptionPage {

  @ViewChild('comparisonChart', { static: false }) comparisonChart: any;
  chart: any;

  mySmartMeters: { id: string, name: string }[] = [];
  selectedSmartMeters: string[] = [];
  reportType: string = 'day';
  sampleCount: number = 2;

  isLoading: boolean = false;

  pageTitle = 'Relatório de comparação de consumo';

  private fixedColors: string[] = [
    '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', '#E6B333', '#3366E6', '#999966',
    '#99FF99', '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', '#FF99E6',
    '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC', '#66994D', '#B366CC', '#4D8000', '#B33300',
    '#CC80CC', '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399', '#E666B3', '#33991A',
    '#CC9999', '#B3B31A', '#00E680', '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', '#E64D66', '#4DB380', '#FF4D4D',
    '#99E6E6', '#6666FF', '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', '#E6B333',
    '#3366E6', '#999966', '#99FF99', '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3',
    '#66991A', '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC', '#66994D', '#B366CC',
    '#4D8000', '#B33300', '#CC80CC', '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', '#4D8066', '#809980', '#E6FF80',
    '#1AFF33', '#999933'
  ];

  constructor(
    private sqlFileReaderService: SqlFileReaderService,
    private fiwareApiService: FiwareAPIService,
    private toastController: ToastController
  ) {
    this.loadMySmartMeters();
    Chart.register(...registerables);
  }

  ionViewDidEnter() {
    this.initializeChart();
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

  async fetchComparisonData(): Promise<void> {
    this.isLoading = true;
    try {

      const isValid = await this.validateFields();
      if (!isValid) {
        this.isLoading = false;
        return;
      }

      // Obtém o SQL formatado com base no tipo de comparação selecionado
      const content = await this.getSQLFormattedFileContentByComparisonType();

      // Executa a consulta no FIWARE e preenche os dados de comparação
      this.executeAndFillComparisonData(content);
    } catch (error) {
      console.error("Erro ao buscar dados de comparação:", error);
      this.isLoading = false;
    }
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

  async getSQLFormattedFileContentByComparisonType(): Promise<string> {
    let fileContent = '';

    switch (this.reportType) {
      case 'compare_by_hour_last_7_days':
        fileContent = await firstValueFrom(this.sqlFileReaderService.getComparisonByHourLast7DaysFileContent());
        break;
      case 'compare_by_day_last_30_days':
        fileContent = await firstValueFrom(this.sqlFileReaderService.getComparisonByDayLast30DaysFileContent());
        break;
      case 'compare_by_week_last_90_days':
        fileContent = await firstValueFrom(this.sqlFileReaderService.getComparisonByWeekLast90DaysFileContent());
        break;
      case 'compare_by_month_last_3_years':
        fileContent = await firstValueFrom(this.sqlFileReaderService.getComparisonByMonthLast3YearsFileContent());
        break;
      default:
        throw new Error('Tipo de comparação não suportado');
    }

    return this.formatSqlToExecuteOnFiware(fileContent);
  }

  private formatSqlToExecuteOnFiware(content: string): any {
    const inFormatted = `(${this.selectedSmartMeters.map(str => `'${str}'`).join(', ')})`;
    content = content.replace("$1", inFormatted);

    return { stmt: content };
  }

  async executeAndFillComparisonData(body: string) {
    try {
      const data: QuantumLeapSQLEntity = await firstValueFrom(
        this.fiwareApiService.executeQuantumLeapQuery(body)
      );

      if (data) {
        this.updateChartData(data);
        console.log("Consulta de comparação executada com sucesso no QuantumLeap.");
        this.isLoading = false;
      } else {
        console.warn("Nenhum dado retornado da consulta de comparação SQL do QuantumLeap.");
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Erro ao buscar dados SQL de comparação do QuantumLeap', error);
      this.isLoading = false;
    }
  }

  updateChartData(data: QuantumLeapSQLEntity) {
    if (!this.chart) {
      console.error("Chart not initialized.");
      return;
    }

    const measuredAtIndex = data.cols.indexOf('measuredat');
    const consumptionIndex = data.cols.indexOf('consumption');

    if (measuredAtIndex === -1 || consumptionIndex === -1) {
      console.error("Data columns not found.");
      return;
    }

    // Função auxiliar para formatar a data com base em reportType
    const formatData = (dateString: string): string => {
      switch (this.reportType) {
        case 'compare_by_hour_last_7_days':
          return dateString.slice(0, 10); // Extrai "DD/MM/YYYY" de "DD/MM/YYYY HH:MM"
        case 'compare_by_day_last_30_days':
          return dateString.slice(3, 10); // Considera o formato completo "DD/MM/YYYY"
        case 'compare_by_week_last_90_days':
          return " - ";
        case 'compare_by_month_last_3_years':
          return dateString.slice(3, 10); // Extrai "MM/YYYY"
        default:
          return dateString;
      }
    };

    const formatLabel = (dateString: string): string => {
      switch (this.reportType) {
        case 'compare_by_hour_last_7_days':
          return dateString.slice(11, 16); // Extrai "HH:MM" de "DD/MM/YYYY HH:MM"
        case 'compare_by_day_last_30_days':
          return dateString.slice(0, 2); // Extrai DD de "DD/MM/YYYY"
        case 'compare_by_week_last_90_days':
          return dateString;
        case 'compare_by_month_last_3_years':
          return dateString.slice(3, 10); // Extrai "MM/YYYY"
        default:
          return dateString;
      }
    };

    // Cria um objeto para armazenar consumo por data
    const dailyData: { [date: string]: { labels: string[]; consumptions: number[], lastConsumption: number } } = {};

    // Itera sobre as linhas e adiciona os consumos diretamente
    for (let index = 0; index < data.rows.length; index++) {
      const measuredAt = data.rows[index][measuredAtIndex];
      const consumption = parseFloat(data.rows[index][consumptionIndex]);

      const formattedDate = formatData(measuredAt);
      const formattedLabel = formatLabel(measuredAt);

      // Se não houver significa que é a primeira vez passando. Então vai criar o dataset e adicionar como zero pra dps fazer os cálculos
      if (!dailyData[formattedDate]) {
        dailyData[formattedDate] = { labels: [], consumptions: [], lastConsumption: 0 };

        dailyData[formattedDate].labels.push(formattedLabel);
        dailyData[formattedDate].consumptions.push(0);
        dailyData[formattedDate].lastConsumption = consumption;
      }
      else {

        const previousConsumption = dailyData[formattedDate].lastConsumption;
        var realConsumption = consumption - previousConsumption;
        if (realConsumption < 0) {
          realConsumption = 0
        }

        dailyData[formattedDate].labels.push(formattedLabel);
        dailyData[formattedDate].consumptions.push(realConsumption);
        dailyData[formattedDate].lastConsumption = consumption;
      }
    }

    const datasets = Object.keys(dailyData).map((date, index) => ({
      label: date,
      data: dailyData[date].consumptions,
      fill: false,
      borderColor: this.getFixedColor(index),
      tension: 0.1,
    }));

    // Atualiza o gráfico
    this.chart.data.labels = datasets.length > 0 ? dailyData[Object.keys(dailyData)[0]].labels : [];
    this.chart.data.datasets = datasets;
    this.chart.update();
  }

  private getFixedColor(index: number): string {
    return this.fixedColors[index % this.fixedColors.length];
  }


  initializeChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.comparisonChart.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Consumo (kW)',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Data'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Consumo'
            },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
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