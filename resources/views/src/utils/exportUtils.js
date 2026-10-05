/**
 * exportUtils.js
 * Utility to export admin data arrays into Excel-compatible CSV files.
 */
import { Platform } from 'react-native';

export function exportToCSV(filename, columns, data) {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // 1. Build Header Row
  const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // 2. Build Data Rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  });

  // 3. Combine with UTF-8 BOM so Excel opens currency symbols and UTF-8 characters correctly
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
