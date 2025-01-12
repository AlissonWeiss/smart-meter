import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonSelectOption, IonSelect, IonButton, IonSpinner, IonInput } from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { FiwareAPIService, QuantumLeapSQLEntity } from 'src/app/services/fiware-api/fiware-api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-kilowatt-prices',
  templateUrl: './kilowatt-prices.page.html',
  styleUrls: ['./kilowatt-prices.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, IonSelectOption, IonSelect, IonButton, IonSpinner, IonInput]
})
export class KilowattPricesPage {
  @ViewChild('lineChart', { static: false }) lineChart: any;
  chart: any;

  pageTitle: string = '';
  showEyeButton: boolean = true;
  isLoading: boolean = false;
  initialDate?: Date;
  endDate?: Date;

  constructor(
    private fiwareApiService: FiwareAPIService,
    private toastController: ToastController,
  ) {
    this.pageTitle = 'Relatório - Preços do quilowatt';
    Chart.register(...registerables);
  }

  ionViewDidEnter() {
    this.createLineChart();
  }

  async searchForKilowattPrices() {
    this.isLoading = true;

    this.validateFields().then(
      (result) => {
        if (!result) {
          this.isLoading = false;
          return;
        }
        else {
          this.fiwareApiService.getAllPricesFromQuantumLeap(this.initialDate?.toString()!, this.endDate?.toString()!).subscribe(
            (content) => {
              this.updateChartData(content);
              this.isLoading = false;
            },
            (error) => {
              console.log("🚀 ~ KilowattPricesPage ~ searchForKilowattPrices ~ error:", error);
              this.isLoading = false;
            }
          );
        }
      }
    );
  }

  async validateFields(): Promise<boolean> {

    if (!this.initialDate || !this.endDate) {
      await this.showToast('Por favor preencha a data inicial e final', 'warning');
      return false;
    }

    if (this.initialDate >= this.endDate) {
      await this.showToast('A data final deve ser posterior a data inicial', 'warning');
      return false;
    }

    return true;
  }

  createLineChart() {

    if (this.chart) {
      // Se existir algum gráfico, ele é destruído para não afetar o novo
      this.chart.destroy();
    }

    const labels = ['2024-01-01'];
    const data = [0.0];

    this.chart = new Chart(this.lineChart.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Preço do KW',
          data: data,
          borderColor: 'rgba(0, 123, 255, 1)',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          fill: false,
          tension: 0.1
        }]
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
              text: 'Preço do kW'
            },
            beginAtZero: false
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      },
    });
  }

  updateChartData(data: QuantumLeapSQLEntity) {
    if (this.chart) {
      const priceIndex = data.cols.indexOf('price');
      const startDateIndex = data.cols.indexOf('startdatetext');

      const labels: string[] = [];
      const values: number[] = [];

      for (let i = 0; i < data.rows.length; i++) {
        const currentRow = data.rows[i];

        const price = currentRow[priceIndex];
        const startdate = currentRow[startDateIndex];

        labels.push(startdate);
        values.push(price);
      }

      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.update();
    }
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