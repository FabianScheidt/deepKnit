import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EditorStateService } from '../editor-state.service';
import { Router } from '@angular/router';
import { ProjectStage } from '../project';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  public isSetup(): boolean {
    return this.editorStateService.getStage() === ProjectStage.Setup;
  }

  public setup(): void {
    this.editorStateService.setStage(ProjectStage.Setup);
  }

  public isPatterns(): boolean {
    return this.editorStateService.getStage() === ProjectStage.Patterns;
  }

  public patterns(): void {
    this.editorStateService.setStage(ProjectStage.Patterns);
  }

  public isAssembly(): boolean {
    return this.editorStateService.getStage() === ProjectStage.Assembly;
  }

  public assembly(): void {
    this.editorStateService.setStage(ProjectStage.Assembly);
  }

  public toggleMoreOverlay(): void {
    this.moreOverlayVisible = !this.moreOverlayVisible;
  }

  public undo(): void {
    this.editorStateService.undo();
  }

  public redo(): void {
    this.editorStateService.redo();
  }

  public logProject(): void {
    const project = JSON.parse(this.editorStateService.serializeProject());
    console.log('Current Project:', project);
  }

}
