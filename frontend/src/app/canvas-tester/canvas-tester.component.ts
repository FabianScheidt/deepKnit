import { Component, OnInit } from '@angular/core';
import { Knitpaint } from '../knitpaint';

@Component({
  selector: 'app-canvas-tester',
  templateUrl: './canvas-tester.component.html',
  styleUrls: ['./canvas-tester.component.scss']
})
export class CanvasTesterComponent implements OnInit {

  someKnitpaint: Knitpaint;

  constructor() {
    const someWidth = 50;
    const someHeight = 100;
    const someArray = (<any>[
      Array(Math.floor(someWidth / 2)).fill(1), Array(Math.ceil(someWidth / 2)).fill(2),
      [Array(Math.floor(someHeight / 2 - 1)).fill([
        [0, 0, 0, 13], Array(someWidth - 8).fill(1), [13, 0, 0, 0],
        [0, 0, 0, 13], Array(someWidth - 8).fill(2), [13, 0, 0, 0]])
      ],
      Array(Math.floor(someWidth / 2)).fill(3), Array(Math.ceil(someWidth / 2)).fill(4)
    ]).flat(4);
    const someArrayBuffer = (new Uint8Array(someArray)).buffer;
    this.someKnitpaint = new Knitpaint(someArrayBuffer, someWidth);
  }

  ngOnInit() {
  }

}
