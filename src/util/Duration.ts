export function formatDuration(milliseconds: number): string {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  seconds %= 60;
  let hours = Math.floor(minutes / 60);
  minutes %= 60;
  const days = Math.floor(hours / 24);
  hours %= 24;

  const secondsString = seconds.toString().padStart(2, '0');
  const minutesString = minutes.toString().padStart(2, '0');
  const hoursString = hours.toString().padStart(2, '0');
  let timeString = `${hoursString}:${minutesString}:${secondsString}`;
  if (days > 0) {
    const daysString = days.toString().padStart(2, '0');
    timeString = `${daysString}:${timeString}`;
  }
  return timeString;
}
