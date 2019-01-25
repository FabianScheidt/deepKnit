import { Component, Input, OnInit } from '@angular/core';
import { Knitpaint } from '../../../knitpaint';

@Component({
  selector: 'app-pattern',
  templateUrl: './pattern.component.html',
  styleUrls: ['./pattern.component.scss']
})
export class PatternComponent implements OnInit {

  @Input() knitpaint: Knitpaint;

  constructor() { }

  ngOnInit() {
  }

}
