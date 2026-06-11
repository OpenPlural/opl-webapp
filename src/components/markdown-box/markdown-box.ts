import {Component, computed, ElementRef, input, output, signal, ViewChild} from '@angular/core';
import {parseMarkdown} from '../../util/Markdown';

@Component({
  selector: 'app-markdown-box',
  imports: [],
  templateUrl: './markdown-box.html',
})
export class MarkdownBox {
  readonly textareaName = input.required<string>();
  readonly markdown = input.required<string>();
  readonly editable = input.required<boolean>();
  readonly changeMarkdown = output<string>();

  protected readonly editing = signal<boolean>(false);
  protected readonly updatedMarkdown = signal<string | null>(null);

  protected readonly relevantMarkdown = computed(() => {
    const updatedMarkdown = this.updatedMarkdown();
    if (updatedMarkdown) {
      return updatedMarkdown;
    }
    return this.markdown();
  });
  protected readonly htmlText = computed(() => {
    const markdown = this.relevantMarkdown();
    return parseMarkdown(markdown);
  });

  @ViewChild('markdownEditor') set textarea(ref: ElementRef) {
    if (ref) {
      ref.nativeElement.focus();
    }
  }

  protected inputChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.updatedMarkdown.set(input.value);
    this.changeMarkdown.emit(input.value);
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
