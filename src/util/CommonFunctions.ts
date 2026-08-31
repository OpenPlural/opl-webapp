export function openDialog(id: string) {
  const dialog = document.getElementById(id) as HTMLDialogElement;
  dialog.showModal();
}

export function closeDialog(id: string) {
  const dialog = document.getElementById(id) as HTMLDialogElement;
  dialog.close();
}
