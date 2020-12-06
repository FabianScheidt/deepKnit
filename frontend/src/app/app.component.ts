import { Component, OnInit } from '@angular/core';
import * as uuidv4 from 'uuid/v4';
import { MatomoTracker } from 'ngx-matomo';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(private matomoTracker: MatomoTracker) {
    if (localStorage) {
      if (!localStorage.getItem('client-uuid')) {
        localStorage.setItem('client-uuid', uuidv4());
      }
      matomoTracker.setUserId(localStorage.getItem('client-uuid'));
    }
  }

  ngOnInit() {
  }

}
