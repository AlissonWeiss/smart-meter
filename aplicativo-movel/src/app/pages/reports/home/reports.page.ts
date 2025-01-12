import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonList, IonItem, IonLabel, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronUp, chevronDown } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonList, IonItem, IonLabel, IonButton, IonIcon]
})
export class ReportsPage implements OnInit {

  pageTitle: string = '';

  reports = [
    {
      name: 'Meu gasto mensal',
      url: 'report/monthly-cost',
      description: 'Este relatório permite a seleção de um ou mais smart meters para análise, e oferece a visualização do consumo mensal, a partir do dia inicial configurado, discriminando o consumo diário e seu respectivo valor.',
      showDescription: false
    },
    {
      name: 'Meu consumo',
      url: 'report/consumption-report',
      description: 'Este relatório permite a seleção de um ou mais smart meters para análise, e oferece a visualização do consumo de energia elétrica com detalhamento diário, semanal, mensal, anual ou total, no período especificado.',
      showDescription: false
    },
    {
      name: 'Limites de consumo',
      url: 'report/consumption-limits',
      description: 'Este relatório permite visualizar o andamento de seus limites de consumo, com detalhamento diário, semanal ou mensal.',
      showDescription: false
    },
    {
      name: 'Comparação de consumo',
      url: 'report/compare-consumption',
      description: 'Este relatório permite visualizar e comparar o consumo utilizando, como comparação, medidas como hora, dia, semana, mês e ano.',
      showDescription: false
    },
    {
      name: 'Preço de quilowatt',
      url: 'report/kilowatt-prices',
      description: 'Este relatório permite visualizar, em forma de gráfico de linha, o preço do quilowatt e oferece a visualização dentro de um range de datas específicado.',
      showDescription: false
    },
    {
      name: 'Falta de energia',
      url: 'report/lack-of-energy',
      description: 'Este relatório oferece a visualização das falhas de energia elétrica, com detalhamento por dispositivo, data e duração, no período especificado.',
      showDescription: false
    },
  ];

  constructor(private router: Router) {
    addIcons({ chevronDown, chevronUp });
  }

  ngOnInit() {
    this.pageTitle = "Meus relatórios";
  }

  toggleReport(selectedReport: any) {
    this.reports.forEach(report => {
      if (report === selectedReport) {
        report.showDescription = !report.showDescription;
      } else {
        report.showDescription = false;
      }
    });
  }

  openReport(report: any) {
    console.log('Abrindo relatório:', report.name);
    this.router.navigateByUrl(report.url);
  }

}
