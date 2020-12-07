import { Component } from '@angular/core';
import { EditorStateService } from '../editor-state.service';
import { Router } from '@angular/router';
import { ProjectStage } from '../project';
import { EditorIoService } from '../editor-io.service';
import { Knitpaint } from '../../knitpaint';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {

  constructor(private editorStateService: EditorStateService,
              private editorIoService: EditorIoService,
              private router: Router) {
    editorStateService.stageChanged.subscribe(() => {
      switch (editorStateService.getStage()) {
        case ProjectStage.Setup:
          router.navigate(['/setup']);
          break;
        case ProjectStage.Patterns:
          router.navigate(['/patterns']);
          break;
        case ProjectStage.Assembly:
          router.navigate(['/assembly']);
          break;
      }
    });
  }

  public isSetup = () => this.editorStateService.getStage() === ProjectStage.Setup;
  public setup = () => this.editorStateService.setStage(ProjectStage.Setup);
  public isPatterns = () => this.editorStateService.getStage() === ProjectStage.Patterns;
  public patterns = () => this.editorStateService.setStage(ProjectStage.Patterns);
  public isAssembly = () => this.editorStateService.getStage() === ProjectStage.Assembly;
  public assembly = () => this.editorStateService.setStage(ProjectStage.Assembly);
  public undoAvailable = () => this.editorStateService.undoAvailable();
  public redoAvailable = () => this.editorStateService.redoAvailable();
  public patternSelected = () => !!this.editorStateService.getSelectedPattern();

  public newProject = () => this.editorStateService.init();
  public openProject = () => { this.editorIoService.initFromFile(); };
  public saveProject = () => { this.editorIoService.saveToFile(); };

  public exportAssemblyToDat = () => { this.editorIoService.exportAssemblyToDatFile(); };
  public importAssemblyFromDat = () => { this.editorIoService.importAssemblyFromDatFile(); };
  public exportAssemblyToImage = () => { this.editorIoService.exportAssemblyToImageFile(); };
  public importAssemblyFromImage = () => { this.editorIoService.importAssemblyFromImageFile(); };
  public exportAssemblyThumbnail = () => { this.editorIoService.exportAssemblyThumbnail(); };

  public exportPatternToDat = () => { this.editorIoService.exportToDatFile(this.editorStateService.getSelectedPattern()); };
  public importPatternFromDat = () => { this.editorIoService.importFromDatFile().subscribe(res => this.addPattern(res)); };
  public exportPatternToImage = () => { this.editorIoService.exportToImageFile(this.editorStateService.getSelectedPattern()); };
  public importPatternFromImage = () => { this.editorIoService.importFromImageFile().subscribe(res => this.addPattern(res)); };
  public exportPatternThumbnail = () => { this.editorIoService.exportThumbnail(this.editorStateService.getSelectedPattern()); };

  public undo = () => this.editorStateService.undo();
  public redo = () => this.editorStateService.redo();

  private addPattern(pattern: Knitpaint) {
    const patterns = this.editorStateService.getPatterns().slice();
    patterns.push(pattern);
    this.editorStateService.setPatterns(patterns);
  }
}
