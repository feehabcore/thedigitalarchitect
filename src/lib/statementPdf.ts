import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import {categoryMeta, type Transaction, type UserProfile} from '@/src/types';
import {formatMoney} from '@/src/lib/currencies';
import {flowThisMonth, netBalance} from '@/src/lib/stats';
import {isSameMonth} from '@/src/lib/dates';

const ISSUER = 'The Digital Architect';
const VALIDITY_MONTHS = 3;

function monthStart(month: Date) {
  return new Date(month.getFullYear(), month.getMonth(), 1);
}

function filterByMonth(transactions: Transaction[], month: Date) {
  return transactions.filter((t) => isSameMonth(new Date(t.date), month));
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export type StatementScope = 'this_month' | 'all';

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthKey(key: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return null;
  return new Date(y, mo - 1, 1);
}

/** Drawn **after** footers so it reads as a finishing stamp on the **last** page only. Sits above the footer band reserved by `autoTable` bottom margin. */
function drawLastPageWatermark(doc: jsPDF) {
  const n = doc.getNumberOfPages();
  doc.setPage(n);
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(234, 236, 248);
  doc.text('THE DIGITAL', pw / 2, ph - 46, {align: 'center', angle: -12});
  doc.text('ARCHITECT', pw / 2, ph - 38, {align: 'center', angle: -12});

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(208, 212, 226);
  doc.text('Official issuer · The Digital Architect', pw / 2, ph - 30, {align: 'center', angle: -12});
}

function drawPageFooters(doc: jsPDF, issued: Date, validUntil: Date) {
  const total = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerMaxW = pw - margin * 2;

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(88, 92, 108);
    const stamp = `Issued by ${ISSUER} · ${issued.toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}`;
    doc.text(stamp, margin, ph - 20);

    const validity = `Valid for verification / reference for ${VALIDITY_MONTHS} months from issuance (through ${validUntil.toLocaleDateString(undefined, {
      dateStyle: 'long',
    })}). Not a bank or legal document.`;
    const wrapped = doc.splitTextToSize(validity, footerMaxW) as string[];
    doc.text(wrapped, margin, ph - 17);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`Page ${i} of ${total}`, pw - margin, ph - 6, {align: 'right'});
    doc.setFont('helvetica', 'normal');
  }
}

export async function downloadTransactionStatementPdf(profile: UserProfile, transactions: Transaction[], scope: StatementScope) {
  const issued = new Date();
  const validUntil = addMonths(issued, VALIDITY_MONTHS);

  const now = new Date();
  const month = now;
  const start = monthStart(month);
  const rows =
    scope === 'this_month'
      ? filterByMonth(transactions, month).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const cc = profile.currencyCode;
  const {income, expense} = scope === 'this_month' ? flowThisMonth(transactions, month) : {income: 0, expense: 0};
  let periodIncome = income;
  let periodExpense = expense;
  if (scope === 'all') {
    for (const t of transactions) {
      if (t.type === 'income') periodIncome += t.amount;
      else periodExpense += t.amount;
    }
  }
  const periodNet = periodIncome - periodExpense;
  const lifetimeNet = netBalance(transactions);

  const periodLabel =
    scope === 'this_month'
      ? `${start.toLocaleString('default', {month: 'long', year: 'numeric'})}`
      : 'All recorded activity';

  const doc = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'});
  doc.setProperties({
    title: 'Account statement',
    subject: `${periodLabel} · ${ISSUER}`,
    author: ISSUER,
    keywords: 'statement, personal finance',
  });

  const pw = doc.internal.pageSize.getWidth();
  let y = 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 95);
  doc.text(`Issued by ${ISSUER}`, 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 80, 100);
  doc.text(`Issued on: ${issued.toLocaleString(undefined, {dateStyle: 'full', timeStyle: 'medium'})}`, 14, y);
  y += 5;
  const validityIntro = `This statement remains valid for reference and informal verification for ${VALIDITY_MONTHS} months from the issue time above (until ${validUntil.toLocaleString(undefined, {
    dateStyle: 'full',
  })}).`;
  const introLines = doc.splitTextToSize(validityIntro, pw - 28) as string[];
  doc.text(introLines, 14, y);
  y += introLines.length * 4 + 3;

  doc.setDrawColor(190, 195, 210);
  doc.setLineWidth(0.3);
  doc.line(14, y, pw - 14, y);
  y += 7;

  doc.setTextColor(20, 24, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Account statement', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`Prepared for: ${profile.name}`, 14, y);
  y += 5;
  doc.text(`Period: ${periodLabel}`, 14, y);
  y += 5;
  doc.text(`Currency: ${cc}`, 14, y);
  doc.setTextColor(0);
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Summary', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Income (${scope === 'this_month' ? 'period' : 'lifetime'}): ${formatMoney(periodIncome, cc)}`, 14, y);
  y += 5;
  doc.text(`Expenses (${scope === 'this_month' ? 'period' : 'lifetime'}): ${formatMoney(periodExpense, cc)}`, 14, y);
  y += 5;
  doc.text(`Net (${scope === 'this_month' ? 'period' : 'lifetime'}): ${formatMoney(periodNet, cc)}`, 14, y);
  y += 5;
  doc.text(`Net from all entries: ${formatMoney(lifetimeNet, cc)}`, 14, y);

  const tableBody = rows.map((t) => {
    const d = new Date(t.date);
    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      t.type === 'income' ? 'Income' : 'Expense',
      categoryMeta(t.category).label,
      t.title,
      t.type === 'income' ? formatMoney(t.amount, cc) : '',
      t.type === 'expense' ? formatMoney(t.amount, cc) : '',
    ];
  });

  autoTable(doc, {
    startY: y + 8,
    head: [['Date', 'Time', 'Type', 'Category', 'Description', 'In', 'Out']],
    body: tableBody.length ? tableBody : [['—', '', '', '', 'No transactions in this period', '', '']],
    styles: {fontSize: 8, cellPadding: 1.5},
    headStyles: {fillColor: [23, 31, 51], textColor: 255},
    columnStyles: {
      0: {cellWidth: 22},
      1: {cellWidth: 18},
      2: {cellWidth: 16},
      3: {cellWidth: 28},
      4: {cellWidth: 42},
      5: {cellWidth: 24, halign: 'right'},
      6: {cellWidth: 24, halign: 'right'},
    },
    margin: {left: 14, right: 14, bottom: 52},
  });

  drawPageFooters(doc, issued, validUntil);
  drawLastPageWatermark(doc);

  const safeName = profile.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'statement';
  const suffix = scope === 'this_month' ? monthKey(month) : 'all';
  const filename = `statement-${safeName}-${suffix}.pdf`;

  try {
    const {Capacitor} = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      doc.save(filename);
      return;
    }

    const {Filesystem, Directory} = await import('@capacitor/filesystem');
    const {Share} = await import('@capacitor/share');

    // Android: triggers phone permission prompt when needed.
    await Filesystem.requestPermissions();

    const pdfBase64 = doc.output('datauristring').split(',')[1] ?? '';
    const write = await Filesystem.writeFile({
      path: filename,
      data: pdfBase64,
      directory: Directory.Documents,
      recursive: true,
    });

    if (write.uri) {
      await Share.share({
        title: 'Transaction statement',
        text: filename,
        url: write.uri,
        dialogTitle: 'Save / share statement',
      });
      return;
    }
  } catch {
    // ignore and fall back to browser save
  }

  doc.save(filename);
}

export async function downloadMonthlyStatementPdf(profile: UserProfile, transactions: Transaction[], month: string | Date) {
  const monthDate = typeof month === 'string' ? parseMonthKey(month) : month;
  if (!monthDate) {
    // fallback: current month
    await downloadTransactionStatementPdf(profile, transactions, 'this_month');
    return;
  }

  const issued = new Date();
  const validUntil = addMonths(issued, VALIDITY_MONTHS);
  const start = monthStart(monthDate);

  const rows = filterByMonth(transactions, monthDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const cc = profile.currencyCode;
  let periodIncome = 0;
  let periodExpense = 0;
  for (const t of rows) {
    if (t.type === 'income') periodIncome += t.amount;
    else periodExpense += t.amount;
  }
  const periodNet = periodIncome - periodExpense;
  const lifetimeNet = netBalance(transactions);

  const periodLabel = `${start.toLocaleString('default', {month: 'long', year: 'numeric'})}`;

  const doc = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'});
  doc.setProperties({
    title: 'Account statement',
    subject: `${periodLabel} · ${ISSUER}`,
    author: ISSUER,
    keywords: 'statement, personal finance',
  });

  const pw = doc.internal.pageSize.getWidth();
  let y = 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 95);
  doc.text(`Issued by ${ISSUER}`, 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 80, 100);
  doc.text(`Issued on: ${issued.toLocaleString(undefined, {dateStyle: 'full', timeStyle: 'medium'})}`, 14, y);
  y += 5;
  const validityIntro = `This statement remains valid for reference and informal verification for ${VALIDITY_MONTHS} months from the issue time above (until ${validUntil.toLocaleString(undefined, {
    dateStyle: 'full',
  })}).`;
  const introLines = doc.splitTextToSize(validityIntro, pw - 28) as string[];
  doc.text(introLines, 14, y);
  y += introLines.length * 4 + 3;

  doc.setDrawColor(190, 195, 210);
  doc.setLineWidth(0.3);
  doc.line(14, y, pw - 14, y);
  y += 7;

  doc.setTextColor(20, 24, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Account statement', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`Prepared for: ${profile.name}`, 14, y);
  y += 5;
  doc.text(`Period: ${periodLabel}`, 14, y);
  y += 5;
  doc.text(`Currency: ${cc}`, 14, y);
  doc.setTextColor(0);
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Summary', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Income (period): ${formatMoney(periodIncome, cc)}`, 14, y);
  y += 5;
  doc.text(`Expenses (period): ${formatMoney(periodExpense, cc)}`, 14, y);
  y += 5;
  doc.text(`Net (period): ${formatMoney(periodNet, cc)}`, 14, y);
  y += 5;
  doc.text(`Net from all entries: ${formatMoney(lifetimeNet, cc)}`, 14, y);

  const tableBody = rows.map((t) => {
    const d = new Date(t.date);
    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      t.type === 'income' ? 'Income' : 'Expense',
      categoryMeta(t.category).label,
      t.title,
      t.type === 'income' ? formatMoney(t.amount, cc) : '',
      t.type === 'expense' ? formatMoney(t.amount, cc) : '',
    ];
  });

  autoTable(doc, {
    startY: y + 8,
    head: [['Date', 'Time', 'Type', 'Category', 'Description', 'In', 'Out']],
    body: tableBody.length ? tableBody : [['—', '', '', '', 'No transactions in this period', '', '']],
    styles: {fontSize: 8, cellPadding: 1.5},
    headStyles: {fillColor: [23, 31, 51], textColor: 255},
    columnStyles: {
      0: {cellWidth: 22},
      1: {cellWidth: 18},
      2: {cellWidth: 16},
      3: {cellWidth: 28},
      4: {cellWidth: 42},
      5: {cellWidth: 24, halign: 'right'},
      6: {cellWidth: 24, halign: 'right'},
    },
    margin: {left: 14, right: 14, bottom: 52},
  });

  drawPageFooters(doc, issued, validUntil);
  drawLastPageWatermark(doc);

  const safeName = profile.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'statement';
  const suffix = monthKey(monthDate);
  const filename = `statement-${safeName}-${suffix}.pdf`;

  try {
    const {Capacitor} = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      doc.save(filename);
      return;
    }

    const {Filesystem, Directory} = await import('@capacitor/filesystem');
    const {Share} = await import('@capacitor/share');
    await Filesystem.requestPermissions();

    const pdfBase64 = doc.output('datauristring').split(',')[1] ?? '';
    const write = await Filesystem.writeFile({
      path: filename,
      data: pdfBase64,
      directory: Directory.Documents,
      recursive: true,
    });

    if (write.uri) {
      await Share.share({
        title: 'Transaction statement',
        text: filename,
        url: write.uri,
        dialogTitle: 'Save / share statement',
      });
      return;
    }
  } catch {
    // ignore and fall back to browser save
  }

  doc.save(filename);
}
