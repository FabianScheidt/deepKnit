import { Component } from '@angular/core';
import { EditorStateService } from '../editor-state.service';
import { Router } from '@angular/router';
import { ProjectStage } from '../project';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {

  public moreOverlayVisible;

  constructor(private editorStateService: EditorStateService, private router: Router) {
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

  public toggleMoreOverlay(): void {
    this.moreOverlayVisible = !this.moreOverlayVisible;
  }

  public newProject(): void {
    this.editorStateService.init();
    this.moreOverlayVisible = false;
  }

  public openProject(): void {
    this.editorStateService.initFromFile();
    this.moreOverlayVisible = false;
  }

  public saveProject(): void {
    this.editorStateService.saveToFile();
    this.moreOverlayVisible = false;
  }

  public exportDat(): void {
    this.editorStateService.exportToDatFile();
    this.moreOverlayVisible = false;
  }

  public importDat(): void {
    this.editorStateService.importFromDatFile();
    this.moreOverlayVisible = false;
  }

  public exportImage(): void {
    // Todo...
  }

  public importImage(): void {
    // Todo...
  }

  public undo(): void {
    this.editorStateService.undo();
    this.moreOverlayVisible = false;
  }
  public redo() {
    this.editorStateService.redo();
    this.moreOverlayVisible = false;
  }


}
