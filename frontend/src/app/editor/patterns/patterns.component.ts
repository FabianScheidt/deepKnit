import { Component, OnInit } from '@angular/core';
import { PatternSamplingService } from '../../api/pattern-sampling.service';
import { Knitpaint } from '../../knitpaint';
import { take } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.scss']
})
export class PatternsComponent implements OnInit {

  private numLoad = 20;
  patternIndices = [];
  sampledPatterns: Knitpaint[] = [];

  constructor(private patternSamplingService: PatternSamplingService) { }

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

}
