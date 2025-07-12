import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import resume from "../output/resume.json" assert { type: "json" };

const doc = new jsPDF();
const margin = 10;
let y = margin;
const pageHeight = doc.internal.pageSize.getHeight();
const pageWidth = doc.internal.pageSize.getWidth();
const MAX_LINE_WIDTH = pageWidth - 2 * margin;
const LINE_SPACING = 4;

// Draw section divider
function drawSectionDivider(yPos) {
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
}

// Page overflow check
function checkPageBreak(y, buffer = 10) {
  if (y + buffer > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

// Header
doc.setFontSize(18);
doc.setFont("helvetica", "bold");
let nameWidth = doc.getTextWidth(resume.basics.name);
doc.setTextColor(0, 0, 0);
doc.text(resume.basics.name, (pageWidth - nameWidth) / 2, y);

doc.setFontSize(9);
doc.setFont("helvetica", "normal");
y += LINE_SPACING + 1;
const contactLine = `${resume.basics.phone} | ${resume.basics.email}`;
doc.text(contactLine, (pageWidth - doc.getTextWidth(contactLine)) / 2, y);
y += LINE_SPACING;
const linksLine = `${resume.basics.profiles[0].url} | ${resume.basics.profiles[1].url}`;
doc.text(linksLine, (pageWidth - doc.getTextWidth(linksLine)) / 2, y);

y += LINE_SPACING;

// SUMMARY
y = checkPageBreak(y);
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(102, 0, 51);
doc.text("SUMMARY", margin, y);
y += LINE_SPACING;

doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);
doc.splitTextToSize(resume.basics.summary, MAX_LINE_WIDTH).forEach(line => {
  y = checkPageBreak(y);
  doc.text(line, margin, y);
  y += LINE_SPACING;
});

drawSectionDivider(y);
y += 2;

// SKILLS
y = checkPageBreak(y);
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(102, 0, 51);
doc.text("SKILLS", margin, y);
y += LINE_SPACING;

doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);

resume.skills.forEach(skill => {
  y = checkPageBreak(y);
  const label = `${skill.name}:`;
  const labelWidth = doc.getTextWidth(label + " ");
  doc.setFont("helvetica", "bold");
  doc.text(label, margin, y);

  doc.setFont("helvetica", "normal");
  const text = skill.keywords.join(", ");
  doc.text(text, margin + labelWidth, y);
  y += LINE_SPACING;
});

drawSectionDivider(y);
y += 2;

// EXPERIENCE
y = checkPageBreak(y);
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(102, 0, 51);
doc.text("PROFESSIONAL EXPERIENCE", margin, y);
y += LINE_SPACING;

resume.work.forEach(job => {
  y = checkPageBreak(y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`${job.name} - ${job.position}`, margin, y);
  y += LINE_SPACING;

  doc.setFont("helvetica", "normal");
  doc.text(`${job.location} | ${job.startDate} – ${job.endDate || "Present"}`, margin, y);
  y += LINE_SPACING;

  // doc.splitTextToSize(job.summary, MAX_LINE_WIDTH).forEach(line => {
  //   y = checkPageBreak(y);
  //   doc.text(line, margin, y);
  //   y += LINE_SPACING;
  // });

  job.highlights.forEach(point => {
    doc.splitTextToSize(`• ${point}`, MAX_LINE_WIDTH).forEach(line => {
      y = checkPageBreak(y);
      doc.text(line, margin + 4, y);
      y += LINE_SPACING;
    });
  });

  y += LINE_SPACING;
});

drawSectionDivider(y);
y += 2;

// PROJECTS
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(102, 0, 51);
doc.text("PROJECTS", margin, y);
y += LINE_SPACING;

resume.projects.forEach(project => {
  y = checkPageBreak(y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(project.name, margin, y);

  const nameWidth = doc.getTextWidth(project.name + " ");
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 255);
  doc.textWithLink(project.url, margin + nameWidth, y, { url: project.url });
  doc.setTextColor(0, 0, 0);
  y += LINE_SPACING;

  doc.splitTextToSize(project.description, MAX_LINE_WIDTH).forEach(line => {
    y = checkPageBreak(y);
    doc.text(line, margin + 4, y);
    y += LINE_SPACING;
  });

  (project.highlights || []).forEach(pt => {
    doc.splitTextToSize(`• ${pt}`, MAX_LINE_WIDTH).forEach(line => {
      y = checkPageBreak(y);
      doc.text(line, margin + 6, y);
      y += LINE_SPACING;
    });
  });

  y += LINE_SPACING;
});

drawSectionDivider(y);
y += 2;

// CERTIFICATIONS
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(102, 0, 51);
doc.text("CERTIFICATIONS", margin, y);
y += LINE_SPACING;

doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);

resume.certificates.forEach(cert => {
  y = checkPageBreak(y);
  const certLine = `${cert.name} - `;
  const textWidth = doc.getTextWidth(certLine);
  doc.text(certLine, margin, y);
  doc.setTextColor(0, 0, 255);
  doc.textWithLink("Link", margin + textWidth, y, { url: cert.url });
  doc.setTextColor(0, 0, 0);
  y += LINE_SPACING;
});

drawSectionDivider(y);
y += 2;

// PROGRAMMING PROFILE
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(102, 0, 51);
doc.text("PROGRAMMING PROFILE", margin, y);
y += LINE_SPACING;

doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);

resume.interests.forEach(profile => {
  y = checkPageBreak(y);
  doc.text(`• ${profile.name} - ${profile.url}`, margin + 4, y);
  y += LINE_SPACING;
});

// Save PDF
doc.save("/home/krishna/Downloads/Sai_Krishna_Gadiraju_Resume.pdf");
