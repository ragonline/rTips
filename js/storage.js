export function saveRows(data) {
  localStorage.setItem('radfil', data);
}

export function loadStoredRows() {
  return localStorage.getItem('radfil');
}