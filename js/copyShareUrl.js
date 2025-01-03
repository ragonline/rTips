export function copyShareUrl() {
  const shareUrl = document.getElementById('shareUrl');
  shareUrl.select();
  document.execCommand('copy');
  alert('Länk kopierad!');
}
