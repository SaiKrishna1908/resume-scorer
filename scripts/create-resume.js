import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import resume from "../output/resume.json" assert { type: "json" };

const doc = new jsPDF();
const margin = 10;
let y = margin;
const pageHeight = doc.internal.pageSize.getHeight();
const SECTIONS_Y_LENGTH_BETWEEN_TITLE_AND_POINTS = 6;

// Draw a section divider
function drawSectionDivider(yPos) {
  const lineMargin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setDrawColor(200); // light gray
  doc.line(lineMargin, yPos, pageWidth - lineMargin, yPos);
}

// Page overflow utility
function checkPageBreak(doc, y, buffer = 10) {
  if (y + buffer > pageHeight) {
    doc.addPage();
    return margin;
  }
  return y;
}

// Header
const pageWidth = doc.internal.pageSize.getWidth();
doc.setFontSize(18);
doc.setFont("helvetica", "bold");
let nameWidth = doc.getTextWidth(resume.basics.name);
doc.text(resume.basics.name, (pageWidth - nameWidth) / 2, y);

doc.setFontSize(11);
doc.setFont("helvetica", "normal");
y += 6;
const contactLine = `${resume.basics.phone} | ${resume.basics.email}`;
let contactWidth = doc.getTextWidth(contactLine);
doc.text(contactLine, (pageWidth - contactWidth) / 2, y);

y += 5;
const linksLine = `${resume.basics.profiles[0].url} | ${resume.basics.profiles[1].url}`;
let linksWidth = doc.getTextWidth(linksLine);
doc.text(linksLine, (pageWidth - linksWidth) / 2, y);

y += 10;

// Summary
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("SUMMARY", margin, y);
y += 6;
doc.setFont("helvetica", "normal");
const summaryText = doc.splitTextToSize(resume.basics.summary, 190);
summaryText.forEach(line => {
  y = checkPageBreak(doc, y);
  doc.text(line, margin, y);
  y += 5;
});

drawSectionDivider(y);
y += 3;

// Skills
y += SECTIONS_Y_LENGTH_BETWEEN_TITLE_AND_POINTS;
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("SKILLS", margin, y);
y += 6;

const MAX_LINE_WIDTH = pageWidth - 2 * margin;

resume.skills.forEach(skill => {
  y = checkPageBreak(doc, y);

  const label = `${skill.name}:`;
  doc.setFont("helvetica", "bold");
  doc.text(label, margin, y);

  const labelWidth = doc.getTextWidth(label + " ");
  const startX = margin + labelWidth;
  doc.setFont("helvetica", "normal");

  let currentLine = "";
  let currentX = startX;

  skill.keywords.forEach((keyword, index) => {
    const keywordText = (index < skill.keywords.length - 1) ? `${keyword}, ` : keyword;
    const keywordWidth = doc.getTextWidth(keywordText);

    if (currentX + keywordWidth > pageWidth - margin) {
      // Write current line
      doc.text(currentLine.trim(), startX, y);
      y += 6;
      y = checkPageBreak(doc, y);
      currentLine = "";
      currentX = startX;
    }

    currentLine += keywordText;
    currentX += keywordWidth;
  });

  // Print remaining line
  if (currentLine) {
    doc.text(currentLine.trim(), startX, y);
    y += 6;
  }
});

drawSectionDivider(y);
y += 3;

// Work Experience
y += 4;
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("PROFESSIONAL EXPERIENCE", margin, y);
y += SECTIONS_Y_LENGTH_BETWEEN_TITLE_AND_POINTS;

resume.work.forEach(job => {
  y = checkPageBreak(doc, y);
  doc.setFont("helvetica", "bold");
  doc.text(`${job.name} - ${job.position}`, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`${job.location} | ${job.startDate} – ${job.endDate || "Present"}`, margin, y);
  y += 6;

  const jobSummary = doc.splitTextToSize(job.summary, 190);
  jobSummary.forEach(line => {
    y = checkPageBreak(doc, y);
    doc.text(line, margin, y);
    y += 5;
  });

  job.highlights.forEach(point => {
    const lines = doc.splitTextToSize(`• ${point}`, 190);
    lines.forEach(line => {
      y = checkPageBreak(doc, y);
      doc.text(line, margin + 4, y);
      y += 5;
    });
  });

  y += 6;
});

drawSectionDivider(y);
y += 6;

// Projects
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("PROJECTS", margin, y);
y += SECTIONS_Y_LENGTH_BETWEEN_TITLE_AND_POINTS;

resume.projects.forEach(project => {
  y = checkPageBreak(doc, y);
  doc.setFont("helvetica", "bold");
  doc.text(project.name, margin, y);

  const nameWidth = doc.getTextWidth(project.name + " ");
  doc.setTextColor(0, 0, 255);
  doc.setFont("helvetica", "normal");
  doc.textWithLink(project.url, margin + nameWidth, y, { url: project.url });
  doc.setTextColor(0, 0, 0);
  y += 5;

  const wrappedDescription = doc.splitTextToSize(project.description, 190);
  wrappedDescription.forEach(line => {
    y = checkPageBreak(doc, y);
    doc.text(line, margin + 4, y);
    y += 5;
  });

  (project.highlights || []).forEach(pt => {
    const lines = doc.splitTextToSize(`• ${pt}`, 190);
    lines.forEach(line => {
      y = checkPageBreak(doc, y);
      doc.text(line, margin + 6, y);
      y += 5;
    });
  });

  y += 4;
});

drawSectionDivider(y);
y += 6;

// Certifications
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("CERTIFICATIONS", margin, y);
y += SECTIONS_Y_LENGTH_BETWEEN_TITLE_AND_POINTS;
doc.setFont("helvetica", "normal");

resume.certificates.forEach(cert => {
  y = checkPageBreak(doc, y);
  const certLine = `${cert.name} - `;
  const textWidth = doc.getTextWidth(certLine);
  doc.text(certLine, margin, y);
  doc.setTextColor(0, 0, 255);
  doc.textWithLink("Link", margin + textWidth, y, { url: cert.url });
  doc.setTextColor(0, 0, 0);
  y += 6;
});

drawSectionDivider(y);
y += 3;

// Programming Profiles
y += 4;
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("PROGRAMMING PROFILE", margin, y);
y += SECTIONS_Y_LENGTH_BETWEEN_TITLE_AND_POINTS;

resume.interests.forEach(profile => {
  y = checkPageBreak(doc, y);
  doc.text(`• ${profile.name} - ${profile.url}`, margin + 4, y);
  y += 5;
});

doc.save("/home/krishna/Downloads/Sai_Krishna_Gadiraju_Resume.pdf");
