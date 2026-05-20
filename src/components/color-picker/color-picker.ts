import { AfterViewInit, Component, input, OnInit, output, signal } from '@angular/core';
import { hexToRgb, rgbToHex, rgbToHsl } from '../../util/ColorConvert';
import { TranslatePipe } from '@ngx-translate/core';
import { openDialog } from '../../util/CommonFunctions';

@Component({
  selector: 'app-color-picker',
  imports: [TranslatePipe],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css',
})
export class ColorPicker implements OnInit, AfterViewInit {
  readonly dialogId = input.required<string>();
  readonly canvasId = input.required<string>();
  readonly initialValue = input.required<string>();

  protected readonly mouseState = signal<boolean>(false);
  protected readonly hsl = signal<{ h: number; s: number; l: number }>({ h: 0, s: 0, l: 0 });
  protected readonly color = signal<string>('#000000');
  readonly selectColor = output<string>();

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private lastMousePosition: { x: number; y: number } | null = null;

  ngOnInit() {
    this.reset(false);
  }

  ngAfterViewInit() {
    this.canvas = document.getElementById(this.canvasId()) as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d', { willReadFrequently: true })!;

    this.renderCanvas();
  }

  openColorPicker() {
    this.reset(true);
    openDialog(this.dialogId());
  }

  protected reset(render: boolean) {
    const color = this.initialValue();
    this.color.set(color);

    const { r, g, b } = hexToRgb(color);
    this.hsl.set(rgbToHsl(r, g, b));

    this.lastMousePosition = null;

    if (render) {
      this.renderCanvas();
    }
  }

  private renderCanvas() {
    const canvas = this.canvas!;
    const ctx = this.context!;

    ctx.fillStyle = `hsl(${this.hsl().h}, 100%, 50%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const white = ctx.createLinearGradient(0, 0, canvas.width, 0);
    white.addColorStop(0, 'rgba(255,255,255,1)');
    white.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = white;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const black = ctx.createLinearGradient(0, 0, 0, canvas.height);
    black.addColorStop(0, 'rgba(0,0,0,0)');
    black.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const {x, y} = this.currentPosition();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI, false);
    ctx.stroke();
  }

  protected pickColor(ignoreState: boolean, cx: number, cy: number): boolean {
    if (!ignoreState && !this.mouseState()) return false;

    const { x, y } = this.convertCoords(cx, cy);
    this.pickColorFromPosition(x, y);
    return true;
  }

  private pickColorFromPosition(x: number, y: number) {
    const pixel = this.context!.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    this.color.set(rgbToHex(r, g, b));
  }

  private convertCoords(x: number, y: number): { x: number; y: number } {
    const rect = this.canvas!.getBoundingClientRect();

    const physX = x - rect.left;
    const physY = y - rect.top;
    const realX = (physX / rect.width) * 600;
    const realY = (physY / rect.height) * 200;
    const canvX = Math.max(0, Math.min(realX, 599));
    const canvY = Math.max(0, Math.min(realY, 199));

    return { x: canvX, y: canvY };
  }

  private currentPosition(): { x: number; y: number } {
    let x, y;
    const mousePosition = this.lastMousePosition;
    if (mousePosition) {
      const coords = this.convertCoords(mousePosition.x, mousePosition.y);
      x = coords.x;
      y = coords.y;
    } else {
      const hsl = this.hsl();
      x = hsl.s * this.canvas!.width;
      y = (1 - hsl.l) * this.canvas!.height;
    }
    return {x, y};
  }

  protected mouseMoved(event: MouseEvent) {
    if (this.pickColor(false, event.clientX, event.clientY)) {
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
      this.renderCanvas();
    }
  }

  protected canvasClicked(event: MouseEvent) {
    if (this.pickColor(true, event.clientX, event.clientY)) {
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
      this.renderCanvas();
    }
  }

  protected hueChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.hsl.update((hsl) => {
      const updated = Object.assign({}, hsl);
      updated.h = parseInt(input.value);
      return updated;
    });
    this.renderCanvas();
    const {x, y} = this.currentPosition();
    this.pickColorFromPosition(x, y);
  }

  protected colorTyped(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    const validColor = /^#?[0-9a-fA-F]{6}$/;
    if (validColor.test(value)) {
      if (value.length === 6) {
        value = '#' + value;
      }
      const { r, g, b } = hexToRgb(value);
      this.hsl.set(rgbToHsl(r, g, b));
      this.color.set(value);
    }
  }

  protected submitForm() {
    this.selectColor.emit(this.color());
  }
}
