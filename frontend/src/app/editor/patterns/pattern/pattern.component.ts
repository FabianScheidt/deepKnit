import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Knitpaint } from '../../../knitpaint';
import { KnitpaintThumbnailService } from '../../../api/knitpaint-thumbnail.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-pattern',
  templateUrl: './pattern.component.html',
  styleUrls: ['./pattern.component.scss']
})
export class PatternComponent implements OnChanges {

  @Input() knitpaint: Knitpaint;
  @Input() saved = false;
  @Output() savedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() showThumbnail = false;
  public thumbnail: string;

  private knitpaintChanged: Subject<void> = new Subject<void>();

  constructor(private knitpaintThumbnailService: KnitpaintThumbnailService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['knitpaint']) {
      this.knitpaintChanged.next();
      this.fetchPreview();
    }
  }

  /**
   * Fetches a preview image for the current knitpaint
   */
  private fetchPreview() {
    this.thumbnail = null;
    if (this.knitpaint) {
      this.knitpaintThumbnailService
        .generateThumbnail(this.knitpaint, 'png', 200, 2, [160, 170, 185])
        .pipe(takeUntil(this.knitpaintChanged))
        .subscribe((dataUrl) => {
          this.thumbnail = dataUrl;
        });
    }
  }

  /**
   * Toggles the save option and emits the save event
   */
  public toggleSave(): void {
    this.saved = !this.saved;
    this.savedChange.next(this.saved);
  }

}
