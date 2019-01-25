import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Knitpaint } from '../../../knitpaint';

@Component({
  selector: 'app-pattern',
  templateUrl: './pattern.component.html',
  styleUrls: ['./pattern.component.scss']
})
export class PatternComponent {

  @Input() knitpaint: Knitpaint;
  @Input() saved = false;
  @Output() savedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  public toggleSave(): void {
    this.saved = !this.saved;
    this.savedChange.next(this.saved);
  }

}
