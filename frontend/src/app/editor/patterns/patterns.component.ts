import { Component, OnInit } from '@angular/core';
import { PatternSamplingService } from '../../api/pattern-sampling.service';
import { Knitpaint } from '../../knitpaint';
import { take } from 'rxjs/operators';
import * as _ from 'lodash';
import { EditorStateService } from '../editor-state.service';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.scss']
})
export class PatternsComponent implements OnInit {

  private numLoad = 20;
  patternIndices = [];
  sampledPatterns: Knitpaint[] = [];

  constructor(private editorStateService: EditorStateService,
              private patternSamplingService: PatternSamplingService) { }

  ngOnInit() {
    this.loadMorePatterns();
  }

  /**
   * Loads numLoad more patterns
   */
  public loadMorePatterns() {
    this.patternIndices = this.patternIndices.concat(_.range(this.patternIndices.length, this.patternIndices.length + this.numLoad));
    this.patternSamplingService.samplePatterns().pipe(take(this.numLoad)).subscribe((pattern: Knitpaint) => {
      this.sampledPatterns.push(pattern);
      console.log('Received pattern', pattern);
    });
  }

  /**
   * Returns the pattern for an index
   *
   * @param index
   */
  public getPattern(index) {
    if (this.sampledPatterns.length >= index + 1) {
      return this.sampledPatterns[index];
    }
    return null;
  }

  /**
   * Returns if the button for more patterns should be shown
   */
  public isMoreAvailable() {
    return this.sampledPatterns.length === this.patternIndices.length;
  }

  /**
   * Returns a list of saved patterns
   */
  public getSavedPatterns(): Knitpaint[] {
    return this.editorStateService.getPatterns();
  }

  /**
   * Saves a pattern, if it is not yet saved and removes it, if it is
   *
   * @param pattern
   */
  public toggleSavePattern(pattern: Knitpaint): void {
    const patterns = this.editorStateService.getPatterns().slice();
    const index = patterns.indexOf(pattern);
    if (index > -1) {
      patterns.splice(index, 1);
    } else {
      patterns.push(pattern);
    }
    this.editorStateService.setPatterns(patterns);
  }

  /**
   * Returns if the pattern is saved
   *
   * @param pattern
   */
  public isPatternSaved(pattern: Knitpaint): boolean {
    return this.editorStateService.getPatterns().indexOf(pattern) > -1;
  }

}
