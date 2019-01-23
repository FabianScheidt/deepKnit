import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatternsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
