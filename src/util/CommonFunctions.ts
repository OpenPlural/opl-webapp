export function openDialog(id: string) {
  const dialog = document.getElementById(id) as HTMLDialogElement;
  dialog.showModal();
}
