import { Component, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EditorStateService } from '../editor-state.service';
import { Knitpaint } from '../../knitpaint';

@Component({
  selector: 'app-patterns-bar',
  templateUrl: './patterns-bar.component.html',
  styleUrls: ['./patterns-bar.component.scss']
})
export class PatternsBarComponent implements OnChanges {

  @Input() allowRemoval = false;
  @Input() allowSelection = false;
  @Input() selection: Knitpaint;
  @Input() selectionChange: EventEmitter<Knitpaint> = new EventEmitter<Knitpaint>();

  constructor(private editorStateService: EditorStateService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allowSelection'] && !this.allowSelection) {
      this.selection = null;
    }
  }

  /**
   * Returns a list of saved patterns
   */
  public getSavedPatterns(): Knitpaint[] {
    return this.editorStateService.getPatterns();
  }

  /**
   * Removes a pattern from the list of saved patterns
   *
   * @param pattern
   */
  public removePattern(pattern: Knitpaint): void {
    const patterns = this.editorStateService.getPatterns().slice();
    const index = patterns.indexOf(pattern);
    if (index > -1) {
      patterns.splice(index, 1);
      this.editorStateService.setPatterns(patterns);
    }
  }

  /**
   * Emits the selection change event
   *
   * @param pattern
   */
  public select(pattern: Knitpaint): void {
    if (this.allowSelection) {
      this.selection = pattern;
      this.selectionChange.next(this.selection);
    }
  }

}
