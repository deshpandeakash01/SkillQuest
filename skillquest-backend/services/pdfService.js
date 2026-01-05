const fs = require('fs');
// const PDFDocument = require('pdfkit'); // Requires 'npm install pdfkit'

exports.generateCertificate = (userName, skillName, date) => {
    // This is a stub. To make this work:
    // 1. Run: npm install pdfkit
    // 2. Uncomment the require
    // 3. Use the doc code below

    /*
    const doc = new PDFDocument({ layout: 'landscape' });
    const filename = `Certificate-${userName}-${skillName}.pdf`;
    const path = `./uploads/${filename}`;
    
    doc.pipe(fs.createWriteStream(path));
    
    doc.fontSize(40).text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(25).text('This is to certify that', { align: 'center' });
    doc.fontSize(30).text(userName, { align: 'center', underline: true });
    doc.fontSize(25).text('has successfully completed the skill', { align: 'center' });
    doc.fontSize(30).text(skillName, { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(15).text(`Date: ${date}`, { align: 'right' });
    
    doc.end();
    return filename;
    */

    return "mock-certificate.pdf";
};
