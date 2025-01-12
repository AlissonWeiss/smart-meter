import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonContent, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonMenu, IonMenuToggle, IonNote, IonRouterOutlet, IonSplitPane } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, cashSharp, heartOutline, heartSharp, homeOutline, homeSharp, newspaperOutline, newspaperSharp, settingsOutline, settingsSharp, statsChartOutline, statsChartSharp, timeOutline, timeSharp, wifiOutline, wifiSharp } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet]
})
export class AppComponent {
  public appPages = [
    { title: 'Inicio', url: '/home', icon: 'home' },
    { title: 'Consumo em Tempo Real', url: '/real-time-consumption', icon: 'time' },
    { title: 'Smart Meters', url: '/smart-meters', icon: 'heart' },
    { title: 'Relatórios', url: '/reports/home', icon: 'newspaper' },
    { title: 'Acompanhamento de preço', url: '/quilowatt', icon: 'cash' },
    { title: 'Ponto de acesso', url: 'configuration/access-point', icon: 'wifi' },
    { title: 'Configurações', url: '/my-configurations', icon: 'settings' }
  ];

  constructor() {
    addIcons({ heartOutline, heartSharp, homeOutline, homeSharp, cashOutline, cashSharp, newspaperOutline, newspaperSharp, statsChartSharp, statsChartOutline, timeSharp, timeOutline, settingsOutline, settingsSharp, wifiOutline, wifiSharp });
  }

}
