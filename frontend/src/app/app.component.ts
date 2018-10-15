import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Knitpaint } from './knitpaint';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  knitpaint: Knitpaint;
  width = 57;

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {
    // Fetch some knitpaint file
    this.httpClient.get('/assets/sample_test.txt', { responseType: 'blob' }).subscribe((res) => {
      this.knitpaint = new Knitpaint(res);
    });
  }
}
