import { Component } from '@angular/core';
import { EditorStateService } from '../editor-state.service';
import { Router } from '@angular/router';
import { ProjectStage } from '../project';
import { EditorIoService } from '../editor-io.service';

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

  public newProject(): void {
    this.editorStateService.init();
  }

  public openProject(): void {
    this.editorIoService.initFromFile();
  }

  public saveProject(): void {
    this.editorIoService.saveToFile();
  }

  public exportDat(): void {
    this.editorIoService.exportToDatFile();
  }

  public importDat(): void {
    this.editorIoService.importFromDatFile();
  }

  public exportImage(): void {
    this.editorIoService.exportToImageFile();
  }

  public importImage(): void {
    this.editorIoService.importFromImageFile();
  }

  public undo(): void {
    this.editorStateService.undo();
  }
  public redo() {
    this.editorStateService.redo();
  }


}
