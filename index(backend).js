const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Store uploaded PDF files in a temporary folder
const TEMP_FOLDER = './temp';
if (!fs.existsSync(TEMP_FOLDER)) {
  fs.mkdirSync(TEMP_FOLDER);
}

// Define a route to handle PDF file uploads
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const pdfBuffer = req.file.buffer;
  const fileName = `${TEMP_FOLDER}/${Date.now()}.pdf`;

  fs.writeFileSync(fileName, pdfBuffer);

  res.status(200).json({ message: 'File uploaded successfully' });
});

// Define a route to retrieve and display a stored PDF file
app.get('/pdf/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = `${TEMP_FOLDER}/${filename}`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const fileContent = fs.readFileSync(filePath);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(fileContent);
});

// Define a route to extract selected pages and create a new PDF
app.post('/extract-pages', async (req, res) => {
  const { pages, originalFilename } = req.body;
  const originalFilePath = `${TEMP_FOLDER}/${originalFilename}`;

  if (!fs.existsSync(originalFilePath)) {
    return res.status(404).json({ error: 'Original file not found' });
  }

  try {
    const pdfDoc = await PDFDocument.load(fs.readFileSync(originalFilePath));
    const newPdfDoc = await PDFDocument.create();

    for (const page of pages) {
      const pageNumber = parseInt(page);
      if (isNaN(pageNumber) || pageNumber <= 0 || pageNumber > pdfDoc.getPageCount()) {
        return res.status(400).json({ error: 'Invalid page number' });
      }

      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
      newPdfDoc.addPage(copiedPage);
    }

    const newPdfBuffer = await newPdfDoc.save();
    const newFilename = `${Date.now()}_extracted.pdf`;

    fs.writeFileSync(`${TEMP_FOLDER}/${newFilename}`, newPdfBuffer);

    res.status(200).json({ message: 'New PDF created successfully', filename: newFilename });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

