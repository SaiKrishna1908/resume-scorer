import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import resume from "../output/resume.json" assert { type: "json" };
import path from "path";
import os from "os";
import { existsSync, mkdirSync } from "fs";

const doc = new jsPDF();
const margin = 10;
let y = margin;
const pageHeight = doc.internal.pageSize.getHeight();
const SECTIONS_Y_LENGTH_BETWEEN_TITLE_AND_POINTS = 3;

// Colors
const headingColor = [0, 51, 102]; // Dark blue for headings
const subHeadingColor = [51, 51, 51]; // Dark gray for subheadings
const linkColor = [0, 0, 255]; // Blue for links
const textColor = [0, 0, 0]; // Black for text

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
doc.setFontSize(16);
doc.setFont("helvetica", "bold");
doc.setTextColor(...headingColor);
let nameWidth = doc.getTextWidth(resume.basics.name);
doc.text(resume.basics.name, (pageWidth - nameWidth) / 2, y);
y += 6;

doc.setFontSize(12);
doc.setFont("helvetica", "italic");
doc.setTextColor(...subHeadingColor);
let labelWidth = doc.getTextWidth(resume.basics.label);
doc.text(resume.basics.label, (pageWidth - labelWidth) / 2, y);
y += 6;

doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.setTextColor(...textColor);
const contactLine = `${resume.basics.phone} | ${resume.basics.email} | ${resume.basics.location.city}, TX`;
let contactWidth = doc.getTextWidth(contactLine);
doc.text(contactLine, (pageWidth - contactWidth) / 2, y);

y += 5;
const linksLine = `${resume.basics.profiles[0].url} | ${resume.basics.profiles[1].url}`;
let linksWidth = doc.getTextWidth(linksLine);
doc.text(linksLine, (pageWidth - linksWidth) / 2, y);

drawSectionDivider(y + 2);

y += 7;

// Summary
y = checkPageBreak(doc, y);
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...headingColor);
doc.text("SUMMARY", margin, y);
y += 6;
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.setTextColor(...textColor);
const summaryText = doc.splitTextToSize(
  resume.basics.summary,
  pageWidth - 2 * margin
);
summaryText.forEach((line) => {
  y = checkPageBreak(doc, y);
  doc.text(line, margin, y);
  y += 4;
});

y -= 4;

drawSectionDivider(y + 2);

y += 7;

// Skills
y = checkPageBreak(doc, y);
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...headingColor);
doc.text("SKILLS", margin, y);
y += 6;

const MAX_LINE_WIDTH = pageWidth - 2 * margin;

resume.skills.forEach((skill) => {
  if (skill.keywords.length > 0) {
    y = checkPageBreak(doc, y, 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...subHeadingColor);
    const label = `${skill.name}:`;
    doc.text(label, margin, y);

    const labelWidth = doc.getTextWidth(label + " ");
    const startX = margin + labelWidth;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);

    let currentLine = "";
    let currentX = startX;

    skill.keywords.forEach((keyword, index) => {
      const keywordText =
        index < skill.keywords.length - 1 ? `${keyword}, ` : keyword;
      const keywordWidth = doc.getTextWidth(keywordText);

      if (currentX + keywordWidth > pageWidth - margin) {
        doc.text(currentLine.trim(), startX, y);
        y += 4;
        y = checkPageBreak(doc, y);
        currentLine = "";
        currentX = startX;
      }

      currentLine += keywordText;
      currentX += keywordWidth;
    });

    if (currentLine) {
      doc.text(currentLine.trim(), startX, y);
      y += 4;
    }
  }
});

y -= 4;

drawSectionDivider(y + 2);
y += 7;

// Professional Experience
y = checkPageBreak(doc, y);
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...headingColor);
doc.text("PROFESSIONAL EXPERIENCE", margin, y);
y += 6;

function formatDateToMonthYear(dateStr) {
  if ((dateStr === "Current") | (dateStr === "Present")) {
    return dateStr;
  }
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

resume.work.forEach((job) => {
  y = checkPageBreak(doc, y, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...subHeadingColor);
  doc.text(`${job.name} - ${job.position}`, margin, y);

  const start = formatDateToMonthYear(job.startDate);
  const end = job.endDate ? formatDateToMonthYear(job.endDate) : "Current";
  const dateText = `${start} – ${end}`;

  const dateWidth = doc.getTextWidth(dateText);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...textColor);
  doc.text(dateText, pageWidth - margin - dateWidth, y);
  y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(job.location, margin, y);
  y += 4;

  if (job.summary) {
    const jobSummary = doc.splitTextToSize(job.summary, pageWidth - 2 * margin);
    jobSummary.forEach((line) => {
      y = checkPageBreak(doc, y);
      doc.text(line, margin, y);
      y += 5;
    });
  }

  job.highlights.forEach((point) => {
    const lines = doc.splitTextToSize(`• ${point}`, pageWidth - 2 * margin - 4);
    lines.forEach((line) => {
      y = checkPageBreak(doc, y);
      doc.text(line, margin, y);
      y += 4;
    });
  });

  y += 3;
});

y -= 4;

drawSectionDivider(y + 2);
y += 7;

// Education
y = checkPageBreak(doc, y);
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...headingColor);
doc.text("EDUCATION", margin, y);
y += 6;

resume.education.forEach((edu) => {
  y = checkPageBreak(doc, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...subHeadingColor);
  doc.text(`${edu.studyType} in ${edu.area}`, margin, y);
  // y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  const educationDetails = `${edu.institution}, GPA: ${edu.gpa}`;
  doc.text(
    educationDetails,
    pageWidth - margin - doc.getTextWidth(educationDetails),
    y
  );
  // doc.text(, margin, y);
  y += 4;
});

y -= 4;

drawSectionDivider(y + 2);
y += 7;

// Projects
y = checkPageBreak(doc, y);
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...headingColor);
doc.text("PROJECTS", margin, y);
y += 6;

resume.projects.forEach((project) => {
  y = checkPageBreak(doc, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...subHeadingColor);
  doc.text(project.name, margin, y);

  const nameWidth = doc.getTextWidth(project.name + " ");
  doc.setFontSize(9);
  doc.setTextColor(...linkColor);
  doc.textWithLink(`(${project.url})`, margin + nameWidth, y, {
    url: project.url,
  });
  doc.setTextColor(...textColor);
  y += 5;

  doc.setFont("helvetica", "normal");
  const wrappedDescription = doc.splitTextToSize(
    project.description,
    pageWidth - 2 * margin
  );
  wrappedDescription.forEach((line) => {
    y = checkPageBreak(doc, y);
    doc.text(line, margin, y);
    y += 5;
  });

  (project.highlights || []).forEach((pt) => {
    const lines = doc.splitTextToSize(`• ${pt}`, pageWidth - 2 * margin - 4);
    lines.forEach((line) => {
      y = checkPageBreak(doc, y);
      doc.text(line, margin + 4, y);
      y += 4.0;
    });
  });

  y += 2;
});

y -= 6;
drawSectionDivider(y + 2);
y += 7;

// Certifications
y = checkPageBreak(doc, y);
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...headingColor);
doc.text("CERTIFICATIONS", margin, y);
y += 6;
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.setTextColor(...textColor);

resume.certificates.forEach((cert) => {
  y = checkPageBreak(doc, y);
  const certLine = `• ${cert.name} - `;
  const textWidth = doc.getTextWidth(certLine);
  doc.text(certLine, margin, y);
  doc.setTextColor(...linkColor);
  doc.textWithLink("Link", margin + textWidth, y, { url: cert.url });
  doc.setTextColor(...textColor);
  y += 3.8;
});

y -= 4;

drawSectionDivider(y + 2);
y += 7;

// Programming Profiles
y = checkPageBreak(doc, y);
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...headingColor);
doc.text("PROGRAMMING PROFILES", margin, y);
y += 6;

resume.interests.forEach((profile) => {
  y = checkPageBreak(doc, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  const profileLine = `• ${profile.name} - `;
  const profileWidth = doc.getTextWidth(profileLine);
  doc.text(profileLine, margin, y);
  doc.setTextColor(...linkColor);
  doc.textWithLink(profile.url, margin + profileWidth, y, { url: profile.url });
  doc.setTextColor(...textColor);
  y += 3.8;
});

const downloadsDir = path.join(os.homedir(), "Downloads");
const copyDir = path.join(downloadsDir, "resumes");
const companyDir = path.join(copyDir, process.argv[3] ?? "default");
if (!existsSync(companyDir)) {
  mkdirSync(companyDir, { recursive: true });
}
const fileName = `Sai_Krishna_Gadiraju_Resume.pdf`;

doc.save(path.join(downloadsDir, fileName));
doc.save(path.join(companyDir, fileName));
