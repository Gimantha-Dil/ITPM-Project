const ExcelJS = require('exceljs');

// Generate sales report as Buffer (no file system needed)
const generateSalesReportBuffer = async (notes, sessions, sellerName) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SLIIT Learning Platform';
  workbook.created = new Date();

  // ---- Notes Sales Sheet ----
  const notesSheet = workbook.addWorksheet('Notes Sales', {
    properties: { tabColor: { argb: '7C3AED' } }
  });

  notesSheet.columns = [
    { header: 'Note Title', key: 'title', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Subject', key: 'subject', width: 20 },
    { header: 'Price (LKR)', key: 'price', width: 15 },
    { header: 'Total Purchases', key: 'totalPurchases', width: 18 },
    { header: 'Verified', key: 'verified', width: 12 },
    { header: 'Pending', key: 'pending', width: 12 },
    { header: 'Revenue (LKR)', key: 'revenue', width: 18 },
    { header: 'Avg Rating', key: 'rating', width: 12 },
    { header: 'Created Date', key: 'createdAt', width: 18 }
  ];

  notesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  notesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7C3AED' } };
  notesSheet.getRow(1).alignment = { horizontal: 'center' };

  let totalNoteRevenue = 0;
  notes.forEach(note => {
    const verified = note.purchases.filter(p => p.verified).length;
    const pending = note.purchases.filter(p => !p.verified).length;
    const revenue = verified * note.price;
    totalNoteRevenue += revenue;

    notesSheet.addRow({
      title: note.title,
      category: note.category,
      subject: note.subject,
      price: note.price,
      totalPurchases: note.purchases.length,
      verified,
      pending,
      revenue,
      rating: note.averageRating || 0,
      createdAt: new Date(note.createdAt).toLocaleDateString()
    });
  });

  const noteTotal = notesSheet.addRow({ title: 'TOTAL', revenue: totalNoteRevenue });
  noteTotal.font = { bold: true };

  // ---- Sessions Sheet ----
  const sessionsSheet = workbook.addWorksheet('Session Sales', {
    properties: { tabColor: { argb: '2563EB' } }
  });

  sessionsSheet.columns = [
    { header: 'Session Title', key: 'title', width: 30 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Price (LKR)', key: 'price', width: 15 },
    { header: 'Total Enrolled', key: 'enrolled', width: 16 },
    { header: 'Verified', key: 'verified', width: 12 },
    { header: 'Pending', key: 'pending', width: 12 },
    { header: 'Revenue (LKR)', key: 'revenue', width: 18 },
    { header: 'Session Date', key: 'date', width: 18 },
    { header: 'Status', key: 'status', width: 12 }
  ];

  sessionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sessionsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
  sessionsSheet.getRow(1).alignment = { horizontal: 'center' };

  let totalSessionRevenue = 0;
  sessions.forEach(session => {
    const verified = session.enrollments.filter(e => e.verified).length;
    const pending = session.enrollments.filter(e => !e.verified).length;
    const revenue = verified * session.price;
    totalSessionRevenue += revenue;

    sessionsSheet.addRow({
      title: session.title,
      type: `Type ${session.sessionType}`,
      category: session.category,
      price: session.price,
      enrolled: session.enrollments.length,
      verified,
      pending,
      revenue,
      date: new Date(session.date).toLocaleDateString(),
      status: session.status
    });
  });

  const sessionTotal = sessionsSheet.addRow({ title: 'TOTAL', revenue: totalSessionRevenue });
  sessionTotal.font = { bold: true };

  // ---- Summary Sheet ----
  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: '10B981' } }
  });

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 25 }
  ];

  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };

  const summaryData = [
    { metric: 'Seller Name', value: sellerName },
    { metric: 'Report Generated', value: new Date().toLocaleString() },
    { metric: '', value: '' },
    { metric: 'Total Notes Listed', value: notes.length },
    { metric: 'Total Sessions Created', value: sessions.length },
    { metric: '', value: '' },
    { metric: 'Notes Revenue (LKR)', value: totalNoteRevenue },
    { metric: 'Sessions Revenue (LKR)', value: totalSessionRevenue },
    { metric: 'Total Revenue (LKR)', value: totalNoteRevenue + totalSessionRevenue },
  ];

  summaryData.forEach(row => summarySheet.addRow(row));

  // Write to buffer instead of file
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = { generateSalesReportBuffer };
