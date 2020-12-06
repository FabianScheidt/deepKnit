import { Component, OnInit } from '@angular/core';
import { EditorStateService } from '../editor-state.service';
import { ProjectStage } from '../project';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  width = 100;
  height = 100;

  constructor(private editorStateService: EditorStateService) { }

  ngOnInit() {
    // Update the width and height whenever the knitpaint changes
    this.width = this.editorStateService.getAssembly().width;
    this.height = this.editorStateService.getAssembly().height;
    this.editorStateService.assemblyChanged.subscribe(() => {
      this.width = this.editorStateService.getAssembly().width;
      this.height = this.editorStateService.getAssembly().height;
    });
  }

  /**
   * Resizes the assembly to the set width and height
   */
  public resize() {
    const width = Math.max(1, Math.round(this.width));
    const height = Math.max(1, Math.round(this.height));
    const assembly = this.editorStateService.getAssembly();
    const newAssembly = assembly.resize(width, height);
    this.editorStateService.setAssembly(newAssembly);
  }

  /**
   * Returns if the currently set dimensions are different from the assembly
   */
  public isSizeDifferent() {
    const assemblyWidth = this.editorStateService.getAssembly().width;
    const assemblyHeight = this.editorStateService.getAssembly().height;
    return this.width !== assemblyWidth || this.height !== assemblyHeight;
  }

  /**
   * Moves on to the pattern stage
   */
  public nextStage() {
    this.editorStateService.setStage(ProjectStage.Patterns);
  }

}
