const PDFDocument = require('pdfkit');

// Generate receipt as a Buffer (no file system needed)
const generateReceiptBuffer = async ({ buyerName, buyerEmail, itemTitle, itemType, amount, sellerName, transactionId, date }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          buffer,
          filename: `receipt-${transactionId}-${Date.now()}.pdf`
        });
      });
      doc.on('error', reject);

      // Header background
      doc.rect(0, 0, 612, 120).fill('#7c3aed');
      
      // Header text
      doc.fontSize(28).fillColor('#ffffff').text('SLIIT Learning Platform', 50, 35, { align: 'center' });
      doc.fontSize(14).text('Payment Receipt', 50, 75, { align: 'center' });

      // Receipt details
      doc.fillColor('#333333');
      
      doc.fontSize(10).fillColor('#666666');
      doc.text(`Receipt No: ${transactionId}`, 50, 140);
      doc.text(`Date: ${new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 155);

      doc.moveTo(50, 180).lineTo(562, 180).stroke('#e0e0e0');

      doc.fontSize(12).fillColor('#7c3aed').text('BUYER INFORMATION', 50, 200);
      doc.fontSize(10).fillColor('#333333');
      doc.text(`Name: ${buyerName}`, 50, 225);
      doc.text(`Email: ${buyerEmail}`, 50, 245);

      doc.moveTo(50, 270).lineTo(562, 270).stroke('#e0e0e0');

      doc.fontSize(12).fillColor('#7c3aed').text('ITEM DETAILS', 50, 290);
      doc.fontSize(10).fillColor('#333333');
      doc.text(`Item: ${itemTitle}`, 50, 315);
      doc.text(`Type: ${itemType === 'note' ? 'Study Note' : 'Kuppi Session'}`, 50, 335);
      doc.text(`Seller: ${sellerName}`, 50, 355);

      doc.moveTo(50, 380).lineTo(562, 380).stroke('#e0e0e0');

      doc.fontSize(12).fillColor('#7c3aed').text('PAYMENT DETAILS', 50, 400);
      doc.fontSize(10).fillColor('#333333');
      doc.text('Payment Method: Bank Transfer', 50, 425);
      doc.text('Status: Verified ✓', 50, 445);
      
      doc.rect(50, 475, 512, 50).fill('#f3f4f6');
      doc.fontSize(16).fillColor('#7c3aed').text(`Total Amount: LKR ${parseFloat(amount).toFixed(2)}`, 50, 490, { align: 'center' });

      doc.fontSize(8).fillColor('#999999');
      doc.text('This is an auto-generated receipt from SLIIT Learning Platform.', 50, 700, { align: 'center' });
      doc.text('For any issues, please contact the seller directly.', 50, 715, { align: 'center' });
      doc.text(`Generated on: ${new Date().toISOString()}`, 50, 730, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceiptBuffer };
