import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Knitpaint } from './knitpaint';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewChecked {
  knitpaint: Knitpaint;
  pixelsPerRow = 57;
  selectedColorNumber = 1;

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {
    // Fetch some knitpaint file
    this.httpClient.get('/assets/sample_test.txt', { responseType: 'blob' }).subscribe((res) => {
      this.knitpaint = new Knitpaint(res);
    });
  }

  ngAfterViewChecked() {
    console.log('View Checked');
  }
}
