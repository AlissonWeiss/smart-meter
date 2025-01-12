import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonMenuButton, IonButtons, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menu, menuOutline, menuSharp } from 'ionicons/icons';
import { BackgroundTask } from '@capawesome/capacitor-background-task';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FiwareAPIService, MyConfigurations, QuantumLeapSQLEntity } from 'src/app/services/fiware-api/fiware-api.service';
import { Platform } from '@ionic/angular';
import { Device } from '@capacitor/device';
import { SqlFileReaderService } from 'src/app/services/sql-file-reader/sql-file-reader.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  providers: [FiwareAPIService],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon, IonMenuButton, IonButtons, IonButton]
})
export class HomePage implements OnInit, OnDestroy {

  pageTitle: string = '';
  deviceId: string = '';
  timeForBackgroundUpdate: number = -1;
  isNotificationsAllowed: boolean = false;

  private appStateChangeListener: Promise<PluginListenerHandle> | undefined;

  constructor(
    private ngZone: NgZone,
    private fiwareApiService: FiwareAPIService,
    private platform: Platform,
    private sqlFileReaderService: SqlFileReaderService
  ) {
    addIcons({ menuSharp, menuOutline, menu });
  }

  ngOnInit() {
    this.pageTitle = 'Página inicial';
    this.addListeners();
    this.requestNotificationPermissions();
    this.loadMyConfigurations();
    this.checkForConsumptionLimitsExceeded();
  }

  public ngOnDestroy() {
    this.appStateChangeListener?.then(listener => listener.remove());
  }

  async requestNotificationPermissions() {
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display === 'granted') {
      console.log("Permissão para notificações locais concedida");
    } else {
      console.error("Permissão para notificações locais negada");
    }
  }

  private addListeners(): void {
    console.log("🚀 ~ HomePage ~ addListeners");

    try {
      this.appStateChangeListener = App.addListener(
        'appStateChange',
        async ({ isActive }) => {
          console.log("🚀 ~ appStateChange event received ~ isActive:", isActive);

          this.ngZone.run(async () => {
            if (isActive) {
              console.log("🚀 ~ App is active");
              return;
            }

            console.log("🚀 ~ App is in background, preparing to start BackgroundTask");

            try {
              const taskId = await BackgroundTask.beforeExit(async () => {
                console.log("🚀 ~ HomePage ~ beforeExit callback started ~ taskId:", taskId);

                await this.runTasks();
                console.log("🚀 ~ BackgroundTask finished");

                BackgroundTask.finish({ taskId });
              });
            } catch (error) {
              console.error("🚀 ❌ Error during BackgroundTask execution:", error);
            }
          });
        },
      );
    } catch (error) {
      console.error("🚀 ❌ Error setting up appStateChangeListener:", error);
    }
  }

  private async runTasks(): Promise<void> {
    console.log("🚀 ~ HomePage ~ runTasks:");

    // Verificar se o timeForBackgroundUpdate é -1, nesse caso não executa a tarefa.
    if (this.timeForBackgroundUpdate === -1) {
      console.log("🚀 Background task is disabled by user.");
      return;
    }

    // Converter o intervalo para milissegundos (minutos * 60 * 1000).
    const taskIntervalMs = this.timeForBackgroundUpdate * 60 * 1000;
    console.log("🚀 ~ HomePage ~ runTasks ~ taskIntervalMs:", taskIntervalMs)
    const taskDurationMs = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    const end = new Date().getTime() + taskDurationMs;

    const intervalId = setInterval(async () => {
      const isAppActive = await this.isAppActive();
      if (isAppActive || new Date().getTime() >= end) {
        console.log("🚀 Background task ended.");
        clearInterval(intervalId);
        return;
      }

      console.log('🚀 Background task still active.');
      await this.runInnerTasks();
    }, taskIntervalMs); // Utiliza o intervalo definido pelo usuário
  }

  private async runInnerTasks(): Promise<void> {
    this.checkForConsumptionLimitsExceeded();
  }

  private async isAppActive(): Promise<boolean> {
    const currentState = await App.getState();
    return currentState.isActive;
  }

  private async generateNotification(title: string, body: string) {
    console.log("🚀 ~ HomePage ~ generateNotification ~ title:", title);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: title,
          body: body,
          largeBody: body,
          schedule: { at: new Date(Date.now() + 1000) },
          extra: {
            style: "bigtext",
            bigText: body,
          },
        },
      ],
    });
  }

  loadMyConfigurations() {
    this.platform.ready().then(async () => {
      const deviceId = await Device.getId();
      console.log('Device ID:', deviceId);
      this.deviceId = deviceId.identifier;
      console.log("🚀 ~ HomePage ~ this.platform.ready ~ this.deviceId:", this.deviceId);

      this.fiwareApiService.getMyConfigurations(this.deviceId).subscribe(
        (loadedConfigs: MyConfigurations) => {
          this.isNotificationsAllowed = loadedConfigs.isNotificationsAllowed;
          console.log("🚀 ~ HomePage ~ this.platform.ready ~ loadedConfigs.isNotificationsAllowed:", loadedConfigs.isNotificationsAllowed);
          this.timeForBackgroundUpdate = loadedConfigs.timeForBackgroundUpdate;
          console.log("🚀 ~ HomePage ~ this.platform.ready ~ loadedConfigs.timeForBackgroundUpdate:", loadedConfigs.timeForBackgroundUpdate);
        }
      );
    });
  }

  private checkForConsumptionLimitsExceeded() {
    if (!this.isNotificationsAllowed) {
      console.log("🚀 ~ HomePage ~ checkForConsumptionLimitsExceeded ~ Notifications is not allowed;");
      return;
    }

    console.log("🚀 ~ HomePage ~ checkForConsumptionLimitsExceeded.");
    firstValueFrom(this.sqlFileReaderService.getConsumptionLimitsExceededFileContent()).then(
      (content: string) => {
        var contentUpdated = this.fillPersonalConfigurationIdAndFormatSQL(content);
        this.fiwareApiService.executeQuantumLeapQuery(contentUpdated).subscribe(
          (response: QuantumLeapSQLEntity) => {
            this.checkAndNotify(response);
          }
        );
      }
    );
  }

  private checkAndNotify(data: QuantumLeapSQLEntity) {
    const scenarioIndex = data.cols.indexOf("scenario");
    const consumptionIndex = data.cols.indexOf("consumption");
    const scenarioLimitIndex = data.cols.indexOf("scenario_limit");
    const isLimitExceededIndex = data.cols.indexOf("is_limit_exceeded");

    data.rows.forEach((row) => {
      const scenario = row[scenarioIndex];
      const consumption = row[consumptionIndex];
      const scenarioLimit = row[scenarioLimitIndex];
      const isLimitExceeded = row[isLimitExceededIndex];

      if (isLimitExceeded) {
        const message = `⚠️ Atenção! O consumo ${scenario} ultrapassou o limite configurado.
        Consumo: ${consumption.toFixed(2)} kWh
        Limite: ${scenarioLimit} kWh`;

        this.generateNotification("Limite de Consumo Excedido", message);
      }
    });
  }

  private fillPersonalConfigurationIdAndFormatSQL(content: string): any {
    var id = `'PersonalConfiguration_${this.deviceId}'`;
    const contract = {
      stmt: content.replace(/\$1/g, id),
    };

    return contract;
  }
}
