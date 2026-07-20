import {Component, computed, ElementRef, input, model, signal, ViewChild} from '@angular/core';
import {parseMarkdown} from '../../util/Markdown';

@Component({
  selector: 'app-markdown-box',
  imports: [],
  templateUrl: './markdown-box.html',
  styleUrl: './markdown-box.css',
})
export class MarkdownBox {
  readonly textareaName = input.required<string>();
  readonly editable = input.required<boolean>();
  readonly markdown = model.required<string>();

  protected readonly editing = signal<boolean>(false);

  protected readonly htmlText = computed(() => {
    const markdown = this.markdown();
    return parseMarkdown(markdown);
  });

  @ViewChild('markdownEditor') set textarea(ref: ElementRef) {
    if (ref) {
      ref.nativeElement.focus();
    }
  }

  protected inputChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.markdown.set(input.value);
  }

  protected startEditing() {
    if (!this.editable()) {
      return;
    }
    this.editing.set(true);
  }

  protected stopEditing() {
    this.editing.set(false);
  }
}
