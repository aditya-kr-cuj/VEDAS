export interface CsvRow {
  fullName?: string;
  email?: string;
  password?: string;
}

export function parseCsvToRows(csv: string): CsvRow[] {
  const lines = csv
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const header = lines[0].split(',').map((cell) => cell.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = line.split(',').map((cell) => cell.trim());
    const row: CsvRow = {};

    header.forEach((key, index) => {
      const value = cells[index] ?? '';
      if (key === 'fullname' || key === 'full_name') row.fullName = value;
      if (key === 'email') row.email = value;
      if (key === 'password') row.password = value;
    });

    rows.push(row);
  }

  return rows;
}
