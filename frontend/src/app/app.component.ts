import { Component, OnInit } from '@angular/core';
import * as uuidv4 from 'uuid/v4';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor() {
    if (localStorage && !localStorage.getItem('client-uuid')) {
      localStorage.setItem('client-uuid', uuidv4());
    }
  }

  ngOnInit() {
  }

}
