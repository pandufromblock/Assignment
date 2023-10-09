import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';

import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState([]);
  const [newPdf, setNewPdf] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setPdfFile(file);
    setSelectedPages([]);
  };

  const handlePageChange = (pageNumber) => {
    const selectedIndex = selectedPages.indexOf(pageNumber);
    if (selectedIndex === -1) {
      setSelectedPages([...selectedPages, pageNumber]);
    } else {
      const newSelectedPages = [...selectedPages];
      newSelectedPages.splice(selectedIndex, 1);
      setSelectedPages(newSelectedPages);
    }
  };

  const handleCreatePdf = async () => {
    if (!pdfFile || selectedPages.length === 0) {
      alert('Please upload a PDF file and select at least one page.');
      return;
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const pdfBytes = await pdfFile.arrayBuffer();
      const existingPdfDoc = await PDFDocument.load(pdfBytes);

      for (const pageNumber of selectedPages) {
        const [copiedPage] = await pdfDoc.copyPages(existingPdfDoc, [pageNumber - 1]);
        pdfDoc.addPage(copiedPage);
      }

      const pdfBlob = await pdfDoc.save();

      // Create a download link for the new PDF
      const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      setNewPdf(blobUrl);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="App">
      <h1>PDF Processor</h1>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      {pdfFile && (
        <div className="pdf-preview">
          <Document file={pdfFile} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={300}
                onClick={() => handlePageChange(index + 1)}
                className={selectedPages.includes(index + 1) ? 'selected' : ''}
              />
            ))}
          </Document>
        </div>
      )}
      <div className="page-selection">
        {Array.from(new Array(numPages), (el, index) => (
          <label key={`label_${index + 1}`}>
            <input
              type="checkbox"
              onChange={() => handlePageChange(index + 1)}
              checked={selectedPages.includes(index + 1)}
            />
            Page {index + 1}
          </label>
        ))}
      </div>
      <button onClick={handleCreatePdf}>Create New PDF</button>
      {newPdf && (
        <div className="download-link">
          <a href={newPdf} download="new_pdf.pdf">
            Download New PDF
          </a>
        </div>
      )}
    </div>
  );
}

export default App;

