import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ProjectService } from './project.service';
import { Project } from './project';
import { Knitpaint } from '../knitpaint';
import { KnitpaintConversionService } from '../api/knitpaint-conversion.service';
import saveAs from 'file-saver';

@Injectable()
export class EditorIoService {

  constructor(private projectService: ProjectService,
              private knitpaintConversionService: KnitpaintConversionService) {}

  /**
   * Starts a download containing the current project
   */
  public saveToFile(): void {
    const project = this.projectService.getProject();
    const file = new Blob([JSON.stringify(project)], {type: 'text/plain;charset=utf-8'});
    const now = new Date();
    const datStr = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + '-' + now.getHours() + '-' + now.getMinutes();
    const filename = datStr + '.deepknitproject';
    saveAs(file, filename);
  }

  /**
   * Opens a dialog to load a project from disk
   */
  public initFromFile(): void {
    this.loadFile('text', ['deepknitproject']).subscribe(res => {
      const projectSerialized = JSON.parse(<string>res);
      const project = Project.fromJSON(projectSerialized);
      this.projectService.setProject(project, true);
    });
  }

  /**
   * Converts the current assembly to dat and starts a download
   */
  public exportToDatFile(): void {
    const assembly = this.projectService.getProject().assembly;
    this.knitpaintConversionService.toDat(assembly).subscribe((dat: ArrayBuffer) => {
      const blob = new Blob([new Uint8Array(dat)]);
      saveAs(blob, 'deepknit.dat');
    });
  }

  /**
   * Opens a dialog to select a dat file, converts it and makes it the current assembly
   */
  public importFromDatFile(): void {
    this.loadFile('array-buffer', ['dat']).subscribe(buffer => {
      this.knitpaintConversionService.fromDat(buffer).subscribe((res: Knitpaint) => {
        const project = this.projectService.getProject();
        const newProject = project.setAssembly(res);
        this.projectService.setProject(newProject);
      });
    });
  }

  /**
   * Converts the current assembly to png and starts a download
   */
  public exportToImageFile(): void {
    const assembly = this.projectService.getProject().assembly;
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = assembly.width;
    imageCanvas.height = assembly.height;
    const imageContext = imageCanvas.getContext('2d');
    imageContext.scale(1, -1);
    imageContext.drawImage(assembly.getImage(), 0, 0, assembly.width , assembly.height * -1);
    imageCanvas.toBlob((blob: Blob) => {
      saveAs(blob, 'deepknit.png');
    });
  }

  /**
   * Opens a dialog to select an image file, converts it and makes it the current assembly
   */
  public importFromImageFile(): void {
    this.loadFile('data-url', ['png', 'bmp', 'jpg', 'jpeg', 'gif', 'webp']).subscribe(res => {
      const image = new Image();
      image.addEventListener('load', () => {
        // Read image data
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.scale(1, -1);
        context.drawImage(image, 0, 0, image.width, image.height * -1);
        const imageData = context.getImageData(0, 0, image.width, image.height);

        // Do nearest neighbor search to get color numbers
        const colorNumbersCount = imageData.data.byteLength / 4;
        const colorNumbers = new Uint8Array(colorNumbersCount);
        for (let i = 0; i < colorNumbersCount; i++) {
          const color = [imageData.data[i * 4], imageData.data[i * 4 + 1], imageData[i * 4 + 2]];
          let nearest_index = null;
          let nearest_distance = null;
          Knitpaint.COLOR_TABLE.forEach((table_color, j) => {
            const distance = Math.pow(color[0] - table_color[0], 2)
              + Math.pow(color[1] - table_color[1], 2)
              + Math.pow(color[1] - table_color[1], 2);
            if (nearest_distance === null || distance < nearest_distance) {
              nearest_distance = distance;
              nearest_index = j;
            }
          });
          colorNumbers.fill(nearest_index, i, i + 1);
        }

        // Create knitpaint and set it as assembly
        const knitpaint = new Knitpaint(colorNumbers, imageData.width);
        const newProject = this.projectService.getProject().setAssembly(knitpaint);
        this.projectService.setProject(newProject);
      });
      image.src = res;
    });
  }

  /**
   * Opens a dialog to select a file and loads it
   *
   * @param as
   * Type to load it. Supported values are array-buffer, binary-string, data-url and text
   *
   * @param types
   * Possible file extensions to be loaded
   */
  private loadFile(as?: string, types?: string[]): Observable<any> {
    return new Observable((observer: Observer<any>) => {
      const input: HTMLInputElement = document.createElement('input');
      input.type = 'file';
      if (types) {
        input.accept = types.map(t => '.' + t).join(',');
      }
      input.addEventListener('change', () => {
        const file = input.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          observer.next(reader.result);
          observer.complete();
        });
        reader.addEventListener('error', () => {
          observer.error(reader.error);
          observer.complete();
        });
        switch (as) {
          case 'array-buffer':
            reader.readAsArrayBuffer(file);
            break;
          case 'binary-string':
            reader.readAsBinaryString(file);
            break;
          case 'data-url':
            reader.readAsDataURL(file);
            break;
          case 'text':
          default:
            reader.readAsText(file);
            break;
        }
        reader.readAsArrayBuffer(file);
      });
      input.addEventListener('click', () => {
        input.remove();
      });
      input.click();
    });
  }
}
