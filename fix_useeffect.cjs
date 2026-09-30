const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
if (!c.includes('useEffect')) {
  c = c.replace(/import \{ useState, useMemo \} from 'react';/, "import { useState, useMemo, useEffect } from 'react';");
  fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
  console.log('Added useEffect import');
} else {
  console.log('useEffect already imported or used');
  // wait, is it in the import?
  const firstLine = c.split('\n')[0];
  if (!firstLine.includes('useEffect')) {
    c = c.replace(firstLine, firstLine.replace('useMemo', 'useMemo, useEffect'));
    fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
    console.log('Appended useEffect to import');
  }
}
