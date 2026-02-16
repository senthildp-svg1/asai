import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\senth\\.gemini\\antigravity\\brain\\be5c3501-1373-4ac7-b2dc-5bc4681a8306";
const INPUT_FILE = path.join(ARTIFACT_DIR, "e2e_workflow.md");
const OUTPUT_FILE = path.join(ARTIFACT_DIR, "e2e_workflow.pdf");

async function generatePDF() {
    console.log("Reading workflow markdown...");
    const content = fs.readFileSync(INPUT_FILE, "utf-8");

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;
    let cursorY = 20;

    // Split content into lines and filter out mermaid blocks for now (as they won't render in simple text PDF)
    const lines = content.split('\n').filter(line => !line.includes('```mermaid') && !line.includes('graph TD') && !line.includes('-->') && !line.includes('```'));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ASAI Analytics: E2E Workflow", margin, cursorY);
    cursorY += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    for (const line of lines) {
        if (line.startsWith("# ")) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            cursorY += 10;
            doc.text(line.replace("# ", ""), margin, cursorY);
            cursorY += 10;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
        } else if (line.startsWith("## ")) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            cursorY += 8;
            doc.text(line.replace("## ", ""), margin, cursorY);
            cursorY += 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
        } else if (line.startsWith("### ")) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            cursorY += 6;
            doc.text(line.replace("### ", ""), margin, cursorY);
            cursorY += 6;
            doc.setFont("helvetica", "normal");
        } else if (line.trim() === "") {
            cursorY += 5;
        } else {
            const wrappedText = doc.splitTextToSize(line.replace(/> \[!NOTE\]/g, "NOTE:").replace(/\*\*/g, ""), maxLineWidth);
            if (cursorY + wrappedText.length * 7 > 280) {
                doc.addPage();
                cursorY = 20;
            }
            doc.text(wrappedText, margin, cursorY);
            cursorY += wrappedText.length * 7;
        }
    }

    console.log(`Saving PDF to ${OUTPUT_FILE}...`);
    const pdfOutput = doc.output("arraybuffer");
    fs.writeFileSync(OUTPUT_FILE, Buffer.from(pdfOutput));
    console.log("PDF generation complete!");
}

generatePDF().catch(err => {
    console.error("Failed to generate PDF:", err);
    process.exit(1);
});
