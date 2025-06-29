import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import resume from "../output/resume.json" assert { type: "json" };

const doc = new jsPDF();
const margin = 10;
let y = margin;
const pageHeight = doc.internal.pageSize.getHeight();

// Page overflow utility
function checkPageBreak(doc, y, buffer = 10) {
  if (y + buffer > pageHeight) {
    doc.addPage();
    return margin;
  }
  return y;
}

// Header (centered)
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
doc.text(summaryText, margin, y);
y += summaryText.length * 5;

// Skills
y += 6;
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("SKILLS", margin, y);
y += 6;

resume.skills.forEach(skill => {
  y = checkPageBreak(doc, y);

  const label = `${skill.name}:`;

  // First draw the label in bold
  doc.setFont("helvetica", "bold");
  doc.text(label, margin, y);

  // Then measure its width (AFTER setting the font)
  const labelWidth = doc.getTextWidth(label + " ");

  // Now draw the keywords in normal font
  doc.setFont("helvetica", "normal");
  doc.text(skill.keywords.join(", "), margin + labelWidth, y);

  y += 6;
});


// Work Experience
y += 4;
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("PROFESSIONAL EXPERIENCE", margin, y);
y += 6;
resume.work.forEach(job => {
  y = checkPageBreak(doc, y);
  doc.setFont("helvetica", "bold");
  doc.text(`${job.name} - ${job.position}`, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`${job.location} | ${job.startDate} – ${job.endDate || "Present"}`, margin, y);
  y += 6;

  const jobSummary = doc.splitTextToSize(job.summary, 190);
  doc.text(jobSummary, margin, y);
  y += jobSummary.length * 5;

  job.highlights.forEach(point => {
    y = checkPageBreak(doc, y);
    doc.text(`• ${point}`, margin + 4, y);
    y += 5;
  });
  y += 6;
});

// Projects
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("PROJECTS", margin, y);
y += 6;
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
    y = checkPageBreak(doc, y);
    doc.text(`• ${pt}`, margin + 6, y);
    y += 5;
  });
  y += 4;
});

// Certifications
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("CERTIFICATIONS", margin, y);
y += 6;
doc.setFont("helvetica", "normal");
resume.certificates.forEach(cert => {
  y = checkPageBreak(doc, y);
  const certLine = `${cert.name} - `;
  const textWidth = doc.getTextWidth(certLine);
  doc.text(certLine, margin, y);
  doc.setTextColor(0, 0, 255);
  doc.textWithLink(cert.url, margin + textWidth, y, { url: cert.url });
  doc.setTextColor(0, 0, 0);
  y += 6;
});

// Interests
y += 4;
y = checkPageBreak(doc, y);
doc.setFont("helvetica", "bold");
doc.text("PROGRAMMING PROFILE", margin, y);
y += 6;
resume.interests.forEach(profile => {
  y = checkPageBreak(doc, y);
  doc.text(`• ${profile.name} - ${profile.url}`, margin + 4, y);
  y += 5;
});

doc.save("/home/krishna/Downloads/Sai_Krishna_Gadiraju_Resume.pdf");
