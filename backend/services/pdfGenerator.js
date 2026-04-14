const PDFDocument = require('pdfkit');

const generatePDFReport = (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    // Title
    doc.fontSize(22).font('Helvetica-Bold')
      .text('Monthly Expiry Report', { align: 'center' });
    doc.fontSize(14).font('Helvetica')
      .text(`${monthNames[reportData.month - 1]} ${reportData.year}`, { align: 'center' });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Summary Section
    doc.fontSize(16).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total Products Expired:  ${reportData.totalExpired}`);
    doc.text(`Total Loss Amount:  Rs. ${reportData.totalLoss.toLocaleString('en-IN')}`);
    doc.moveDown(1);

    // Category Breakdown
    if (reportData.categoryBreakdown.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Category-wise Breakdown');
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Category', 50, tableTop, { width: 150 });
      doc.text('Items', 200, tableTop, { width: 80, align: 'center' });
      doc.text('Loss (Rs.)', 280, tableTop, { width: 120, align: 'right' });
      doc.text('% of Total', 400, tableTop, { width: 100, align: 'right' });

      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(10);
      reportData.categoryBreakdown.forEach((cat) => {
        const y = doc.y;
        const percentage = reportData.totalLoss > 0
          ? ((cat.totalLoss / reportData.totalLoss) * 100).toFixed(1)
          : '0.0';
        doc.text(cat._id || 'Other', 50, y, { width: 150 });
        doc.text(cat.count.toString(), 200, y, { width: 80, align: 'center' });
        doc.text(cat.totalLoss.toLocaleString('en-IN'), 280, y, { width: 120, align: 'right' });
        doc.text(`${percentage}%`, 400, y, { width: 100, align: 'right' });
        doc.moveDown(0.3);
      });

      doc.moveDown(1);
    }

    // Expired Products List
    if (reportData.expiredProducts.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Expired Products List');
      doc.moveDown(0.5);

      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      const headerY = doc.y;
      doc.text('#', 50, headerY, { width: 25 });
      doc.text('Product', 75, headerY, { width: 140 });
      doc.text('Category', 215, headerY, { width: 80 });
      doc.text('Qty', 295, headerY, { width: 40, align: 'center' });
      doc.text('Price', 335, headerY, { width: 60, align: 'right' });
      doc.text('Expiry', 400, headerY, { width: 70, align: 'center' });
      doc.text('Loss', 470, headerY, { width: 80, align: 'right' });

      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(8);
      reportData.expiredProducts.forEach((product, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        const y = doc.y;
        const loss = product.price * product.quantity;
        const expiryStr = new Date(product.expiryDate).toLocaleDateString('en-IN');

        doc.text((index + 1).toString(), 50, y, { width: 25 });
        doc.text(product.name, 75, y, { width: 140 });
        doc.text(product.category, 215, y, { width: 80 });
        doc.text(product.quantity.toString(), 295, y, { width: 40, align: 'center' });
        doc.text(`Rs.${product.price}`, 335, y, { width: 60, align: 'right' });
        doc.text(expiryStr, 400, y, { width: 70, align: 'center' });
        doc.text(`Rs.${loss.toLocaleString('en-IN')}`, 470, y, { width: 80, align: 'right' });
        doc.moveDown(0.3);
      });
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica')
      .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.text('Smart Inventory Expiry Alert System', { align: 'center' });

    doc.end();
  });
};

module.exports = { generatePDFReport };
