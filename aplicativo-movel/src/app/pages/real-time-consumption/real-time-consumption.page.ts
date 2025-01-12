import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonList, IonItem, IonLabel, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { FiwareAPIService, ElectricalConsume, SmartMeter } from 'src/app/services/fiware-api/fiware-api.service';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';

@Component({
  selector: 'app-real-time-consumption',
  templateUrl: './real-time-consumption.page.html',
  styleUrls: ['./real-time-consumption.page.scss'],
  standalone: true,
  providers: [FiwareAPIService, ToastController],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonList, IonItem, IonLabel, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption]
})
export class RealTimeConsumptionPage implements OnInit {

  smartMeters: SmartMeter[] = [];
  pageTitle = '';
  selectedSmartMeter: string | undefined;
  autoRefreshTime: number = 0;
  consumptionData: any;
  cards: any[] = [];
  cardState: { [key: string]: boolean } = {};

  constructor(private fiwareAPIService: FiwareAPIService, private toastController: ToastController) {
    addIcons({ eye, eyeOff });
  }

  ngOnInit() {
    this.pageTitle = 'Consumo em Tempo Real';
  }

  ionViewWillEnter() {
    this.loadMySmartMeters();
  }

  updateCurrentConsumption() {

    if (this.selectedSmartMeter == undefined) {
      return;
    }

    this.fiwareAPIService.getCurrentElectricalConsumeBySmartMeter(this.selectedSmartMeter).subscribe({
      next: (data: Array<ElectricalConsume>) => {
        if (data) {
          this.formatConsumptionData(data[0]);
        }
      },
      error: (error) => {
        console.error('Error fetching prices', error);
        this.showToast('Servidor indisponível, tente novamente mais tarde', 'danger');
      },
      complete: () => console.log('Current consuption fetched successfully')
    });
  }

  formatConsumptionData(consumption: ElectricalConsume) {
    if (this.selectedSmartMeter) {
      this.consumptionData = {
        voltage: (consumption.voltage).toFixed(2),
        current: (consumption.current).toFixed(2),
        energy: (consumption.energy).toFixed(2),
        power: (consumption.power).toFixed(2),
        pf: (consumption.pf).toFixed(2),
        frequency: (consumption.frequency).toFixed(2),
        measuredAt: consumption.measuredAt
      };

      this.cards = [
        { key: 'voltage', title: 'Tensão', value: `${this.consumptionData.voltage} V` },
        { key: 'current', title: 'Corrente', value: `${this.consumptionData.current} A` },
        { key: 'energy', title: 'Consumo', value: `${this.consumptionData.energy} Kw` },
        { key: 'power', title: 'Potência', value: `${this.consumptionData.power} W` },
        { key: 'pf', title: 'Fator de Potência', value: this.consumptionData.pf },
        { key: 'frequency', title: 'Frequência', value: `${this.consumptionData.frequency} Hz` },
        { key: 'measuredAt', title: 'Medido em', value: new Date(this.consumptionData.measuredAt).toLocaleString() }
      ];

      this.cards.forEach(card => {
        if (this.cardState[card.key] === undefined) {
          this.cardState[card.key] = true;
        }
      });

    } else {
      this.consumptionData = undefined;
      this.cards = [];
    }
  }

  truncateTwoDecimals(num: number): number {
    return Math.trunc(num * 100) / 100;
  }

  handleChange(e: any) {
    this.selectedSmartMeter = e.detail.value;
    this.updateCurrentConsumption();
  }

  handleChangeAutoRefresh(e: any) {
    this.autoRefreshTime = e.detail.value;

    setInterval(() => {
      if (this.autoRefreshTime != -1) {
        this.updateCurrentConsumption();
      }
    }, this.autoRefreshTime);
  }

  toggleCard(card: any) {
    this.cardState[card.key] = !this.cardState[card.key];
  }

  loadMySmartMeters() {
    var savedSmartMeters = localStorage.getItem('savedSmartMeters');
    if (savedSmartMeters == null) {
      return;
    }

    this.smartMeters = JSON.parse(savedSmartMeters);
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}
