import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCardTitle, IonCardHeader, IonCardContent, IonNote, IonCard, IonButton, IonButtons, IonContent, IonPicker, IonPickerColumn, IonPickerColumnOption, IonHeader, IonMenuButton, IonTitle, IonToolbar, IonInput, IonLabel, IonItem, IonIcon, IonListHeader, IonList, IonSelectOption, IonSelect, IonToggle, IonToast } from '@ionic/angular/standalone';
import { chevronUp, chevronDown } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { FiwareAPIService, MyConfigurations } from 'src/app/services/fiware-api/fiware-api.service';
import { Device } from '@capacitor/device';
import { ToastController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-my-configurations',
  templateUrl: './my-configurations.page.html',
  styleUrls: ['./my-configurations.page.scss'],
  standalone: true,
  providers: [ToastController, Platform],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    FormsModule, IonMenuButton, IonButtons, IonButton, IonInput,
    IonLabel, IonItem, IonIcon, IonListHeader, IonList, IonSelectOption,
    IonSelect, IonToggle, IonPicker, IonPickerColumn, IonPickerColumnOption,
    IonNote, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonToast
  ]
})
export class MyConfigurationsPage implements OnInit {

  pageTitle: string = '';
  preferencesOpen = true;
  fiwareOpen = true;
  firstMonthDayOpen = true;

  fiwareHost: string = '';
  fiwareOrionPort: number = 11026;
  fiwareQuantumLeapPort: number = 18668;
  crateDBPort: number = 14200;
  isNotificationsAllowed: string = "false";
  timeForBackgroundUpdate: string = "-1";
  timeForBackgroundUpdateTemp: string = "-1";
  firstMonthDay: string = "-1";
  firstMonthDayTemp: string = "-1";

  dailyEnergyLimit: string = "-1";
  weeklyEnergyLimit: string = "-1";
  monthlyEnergyLimit: string = "-1";

  private deviceId: string | null = null;

  constructor(
    private fiwareApiService: FiwareAPIService,
    private toastController: ToastController,
    private platform: Platform
  ) {
    this.platform.ready().then(async () => {
      const deviceId = await Device.getId();
      console.log('Device ID:', deviceId);
      this.deviceId = deviceId.identifier;
    });
  }

  async ngOnInit() {
    this.pageTitle = 'Minhas configurações';
    addIcons({ chevronUp, chevronDown });
    this.loadLocalStorageOrDefault();

    await this.loadDeviceInfo();
    if (this.deviceId) {
      this.loadConfigurations();
    } else {
      this.loadLocalStorageOrDefault(); // Fallback para localStorage caso o Device ID não esteja disponível
    }
  }

  async loadDeviceInfo() {
    const info = await Device.getId();
    console.log('Device ID:', info.identifier);
    this.deviceId = info.identifier;
  }

  async loadConfigurations() {
    if (this.deviceId) {
      const configId = `PersonalConfiguration_${this.deviceId}`;
      this.fiwareApiService.getMyConfigurations(configId).subscribe(
        (loadedConfigs: any) => {
          if (loadedConfigs) {
            this.fiwareHost = loadedConfigs.fiwareHost || '';
            this.fiwareOrionPort = loadedConfigs.fiwareOrionPort || 11026;
            this.fiwareQuantumLeapPort = loadedConfigs.fiwareQuantumLeapPort || 18668;
            this.crateDBPort = loadedConfigs.crateDBPort || 14200;
            this.isNotificationsAllowed = loadedConfigs.isNotificationsAllowed ? "true" : "false";
            this.timeForBackgroundUpdate = loadedConfigs.timeForBackgroundUpdate?.toString() || "-1";
            this.timeForBackgroundUpdateTemp = this.timeForBackgroundUpdate;
            this.firstMonthDay = loadedConfigs.firstMonthDay?.toString() || "-1";
            this.firstMonthDayTemp = this.firstMonthDay;
            this.dailyEnergyLimit = loadedConfigs.dailyEnergyLimit?.toString() || "-1";
            this.weeklyEnergyLimit = loadedConfigs.weeklyEnergyLimit?.toString() || "-1";
            this.monthlyEnergyLimit = loadedConfigs.monthlyEnergyLimit?.toString() || "-1";

            this.saveToLocalStorage(loadedConfigs);

          } else {
            this.loadLocalStorageOrDefault();
          }
        },
        (error: any) => {
          console.error('Error loading configurations:', error);
          this.loadLocalStorageOrDefault();
        }
      );
    }
  }


  toggleSection(section: string) {
    if (section === 'preferences') {
      this.preferencesOpen = !this.preferencesOpen;
    } else if (section === 'fiware') {
      this.fiwareOpen = !this.fiwareOpen;
    } else if (section === 'firstMonthDay') {
      this.firstMonthDayOpen = !this.firstMonthDayOpen;
    }
  }

  saveSettings() {
    console.log("🚀 ~ MyConfigurationsPage ~ saveSettings ~ init.");
    const settings: MyConfigurations = {
      fiwareHost: this.fiwareHost,
      fiwareOrionPort: this.fiwareOrionPort,
      fiwareQuantumLeapPort: this.fiwareQuantumLeapPort,
      crateDBPort: this.crateDBPort,
      isNotificationsAllowed: Boolean(this.isNotificationsAllowed),
      dailyEnergyLimit: Number.parseInt(this.dailyEnergyLimit),
      weeklyEnergyLimit: Number.parseInt(this.weeklyEnergyLimit),
      monthlyEnergyLimit: Number.parseInt(this.monthlyEnergyLimit),
      timeForBackgroundUpdate: this.timeForBackgroundUpdateTemp !== "-1" ? Number(this.timeForBackgroundUpdateTemp) : -1,
      firstMonthDay: this.firstMonthDayTemp !== "-1" ? this.firstMonthDayTemp : "-1",
    };
    console.log("🚀 ~ MyConfigurationsPage ~ saveSettings ~ settings:", settings.toString());

    if (this.deviceId) {
      console.log("🚀 ~ MyConfigurationsPage ~ saveSettings ~ this.deviceId:", this.deviceId);
      this.fiwareApiService.saveMyConfigurations(this.deviceId, settings).subscribe({
        next: () => {
          this.showToast('Configurações armazenadas com sucesso', 'success');
          console.log('🚀 Configurações armazenadas com sucesso');
        },
        error: () => {
          this.showToast('Ocorreu um erro ao salvar suas configurações', 'danger');
          console.log('🚀 Ocorreu um erro ao salvar suas configurações');
        }
      });
    }
    else {
      this.showToast('Ocorreu um erro ao salvar suas configurações. DeviceId is null', 'danger');
      console.log("🚀 ~ MyConfigurationsPage ~ saveSettings ~ this.deviceId is null");
    }

    this.saveToLocalStorage(settings);
  }

  saveToLocalStorage(settings: MyConfigurations) {
    localStorage.setItem('fiwareHost', settings.fiwareHost);
    localStorage.setItem('fiwareOrionPort', settings.fiwareOrionPort.toString());
    localStorage.setItem('fiwareQuantumLeapPort', settings.fiwareQuantumLeapPort.toString());
    localStorage.setItem('crateDBPort', settings.crateDBPort.toString());
    localStorage.setItem('isNotificationsAllowed', settings.isNotificationsAllowed.toString());
    localStorage.setItem('dailyEnergyLimit', settings.dailyEnergyLimit.toString());
    localStorage.setItem('weeklyEnergyLimit', settings.weeklyEnergyLimit.toString());
    localStorage.setItem('monthlyEnergyLimit', settings.monthlyEnergyLimit.toString());
    localStorage.setItem('timeForBackgroundUpdate', settings.timeForBackgroundUpdate.toString());
    localStorage.setItem('firstMonthDay', settings.firstMonthDay.toString());
  }

  loadLocalStorageOrDefault() {
    this.fiwareHost = localStorage.getItem('fiwareHost') || '';
    this.fiwareOrionPort = Number(localStorage.getItem('fiwareOrionPort')) || 11026;
    this.fiwareQuantumLeapPort = Number(localStorage.getItem('fiwareQuantumLeapPort')) || 18668;
    this.crateDBPort = Number(localStorage.getItem('crateDBPort')) || 14200;
    this.isNotificationsAllowed = localStorage.getItem('isNotificationsAllowed') || "false";
    this.timeForBackgroundUpdate = localStorage.getItem('timeForBackgroundUpdate') || "-1";
    this.timeForBackgroundUpdateTemp = this.timeForBackgroundUpdate;
    this.firstMonthDay = localStorage.getItem('firstMonthDay') || "-1";
    this.firstMonthDayTemp = this.firstMonthDay;
    this.dailyEnergyLimit = localStorage.getItem('dailyEnergyLimit') || "-1";
    this.weeklyEnergyLimit = localStorage.getItem('weeklyEnergyLimit') || "-1";
    this.monthlyEnergyLimit = localStorage.getItem('monthlyEnergyLimit') || "-1";
  }

  handleChangeBackgroundUpdate(e: any) {
    this.timeForBackgroundUpdateTemp = e.detail.value.toString();
  }

  handleFirstDayOfMonthUpdate(e: any) {
    this.firstMonthDayTemp = e.detail.value.toString();
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
