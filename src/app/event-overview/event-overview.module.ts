import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';

import {EventListComponent} from './event-list/event-list.component';
import {EventOverviewPage} from './event-overview.page';
import {canActivate, redirectUnauthorizedTo} from '@angular/fire/auth-guard';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: EventOverviewPage,
        ...canActivate(redirectUnauthorizedTo(['login']))
      }
    ])
  ],
  declarations: [EventOverviewPage, EventListComponent]
})
export class EventOverviewModule {}
