import { Component } from '@angular/core';
import { EditorStateService } from '../editor-state.service';
import { Router } from '@angular/router';
import { ProjectStage } from '../project';
import { EditorIoService } from '../editor-io.service';
import { Knitpaint } from '../../knitpaint';
import { MatomoTracker } from 'ngx-matomo';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {

  constructor(private editorStateService: EditorStateService,
              private editorIoService: EditorIoService,
              private router: Router,
              private matomoTracker: MatomoTracker) {
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
  public openProject = () => { this.editorIoService.initFromFile(); this.track('project', 'save'); };
  public saveProject = () => { this.editorIoService.saveToFile(); this.track('project', 'load'); };

  public exportAssemblyToDat = () => { this.editorIoService.exportAssemblyToDatFile(); this.track('export', 'assembly-dat'); };
  public importAssemblyFromDat = () => { this.editorIoService.importAssemblyFromDatFile(); this.track('import', 'assembly-dat'); };
  public exportAssemblyToImage = () => { this.editorIoService.exportAssemblyToImageFile(); this.track('export', 'assembly-image'); };
  public importAssemblyFromImage = () => { this.editorIoService.importAssemblyFromImageFile(); this.track('import', 'assembly-image'); };

  public exportPatternToDat = () => { this.editorIoService.exportToDatFile(this.editorStateService.getSelectedPattern()); this.track('export', 'pattern-dat'); };
  public importPatternFromDat = () => { this.editorIoService.importFromDatFile().subscribe(res => this.addPattern(res)); this.track('import', 'pattern-dat'); };
  public exportPatternToImage = () => { this.editorIoService.exportToImageFile(this.editorStateService.getSelectedPattern()); this.track('export', 'pattern-image'); };
  public importPatternFromImage = () => { this.editorIoService.importFromImageFile().subscribe(res => this.addPattern(res)); this.track('import', 'pattern-image'); };

  public undo = () => this.editorStateService.undo();
  public redo = () => this.editorStateService.redo();

  private addPattern(pattern: Knitpaint) {
    const patterns = this.editorStateService.getPatterns().slice();
    patterns.push(pattern);
    this.editorStateService.setPatterns(patterns);
  }

  private track(category: string, action: string) {
    this.matomoTracker.trackEvent(category, action);
  }
}
