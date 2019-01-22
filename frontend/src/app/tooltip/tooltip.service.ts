import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TooltipService {

  public readonly text: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public readonly visible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }
}
