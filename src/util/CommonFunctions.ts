import { WritableSignal } from '@angular/core';

export function openDialog(id: string) {
  const dialog = document.getElementById(id) as HTMLDialogElement;
  dialog.showModal();
}

export function closeDialog(id: string) {
  const dialog = document.getElementById(id) as HTMLDialogElement;
  dialog.close();
}

export async function copyToClipboard(id: string, copied: WritableSignal<boolean>) {
  const input = document.getElementById(id) as HTMLInputElement;
  input.select();
  input.setSelectionRange(0, 99999);
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(input.value);
    copied.set(true);
    setTimeout(() => {
      copied.set(false);
    }, 500);
  }
}
