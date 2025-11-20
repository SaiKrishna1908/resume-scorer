import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import resume from "../output/resume.json" assert { type: "json" };
import os from "os";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const doc = new jsPDF();
const margin = 10;
let y = margin;
const pageHeight = doc.internal.pageSize.getHeight();

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
const contactLine = `${resume.basics.phone} | ${resume.basics.email} | ${resume.basics.location.city}, ${resume.basics.location.region}`;
let contactWidth = doc.getTextWidth(contactLine);
doc.text(contactLine, (pageWidth - contactWidth) / 2, y);

if (resume.basics.profiles !== undefined && resume.basics.profiles.length > 0) {
  y += 5;
  const linksLine = `${resume.basics.profiles[0].url}`;
  let linksWidth = doc.getTextWidth(linksLine);
  doc.text(linksLine, (pageWidth - linksWidth) / 2, y);
}

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

const maxLineWidth = pageWidth - 2 * margin;
const words = resume.basics.summary
  .split(/\s+/)
  .filter((word) => word.length > 0); // Split on whitespace, filter empty
let currentLine = "";
let lineStartY = y; // Track starting y for this section to match original adjustment

words.forEach((word) => {
  const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
  const testWidth = doc.getTextWidth(testLine);

  // If the test line would overflow, print the current line and start a new one
  if (testWidth > maxLineWidth) {
    if (currentLine.length > 0) {
      // Check for page break before printing
      lineStartY = checkPageBreak(doc, lineStartY, 4);
      doc.text(currentLine, margin, lineStartY);
      lineStartY += 4;
    }
    currentLine = word;

    // If even a single word is too long, we'll let it overflow for now (common in resumes; consider hyphenation if needed)
    const wordWidth = doc.getTextWidth(word);
    if (wordWidth > maxLineWidth) {
      // Optional: Log or handle long words, e.g., insert manual hyphen
      // For simplicity, proceed (it will overflow like splitTextToSize)
    }
  } else {
    currentLine = testLine;
  }
});

// Print the last line if any
if (currentLine.length > 0) {
  lineStartY = checkPageBreak(doc, lineStartY, 4);
  doc.text(currentLine, margin, lineStartY);
  lineStartY += 4;
}

y = lineStartY - 4; // Match original y -= 4 adjustment

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

  // if (job.summary) {
  //   const jobSummary = doc.splitTextToSize(job.summary, pageWidth - 2 * margin);
  //   jobSummary.forEach((line) => {
  //     y = checkPageBreak(doc, y);
  //     doc.text(line, margin, y);
  //     y += 5;
  //   });
  // }

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

if (resume.education) {
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
    const educationDetails = `${edu.institution}`;
    doc.text(
      educationDetails,
      pageWidth - margin - doc.getTextWidth(educationDetails),
      y
    );
    // doc.text(, margin, y);
    y += 4;
  });
}

y -= 4;

// Projects
if (resume.projects !== undefined && resume.projects.length > 0) {
  drawSectionDivider(y + 2);
  y += 7;
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
}

if (resume.projects !== undefined && resume.projects.length > 0) {
  y -= 6;
  drawSectionDivider(y + 2);
  y += 7;
}

// Certifications

if (resume.certificates !== undefined) {
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
}

if (resume.interests !== undefined && resume.interests.length > 0) {
  drawSectionDivider(y + 2);
  y += 7;

  // Programming Profiles
  y = checkPageBreak(doc, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...headingColor);
  doc.text("PROGRAMMING PROFILES", margin, y);
  y += 6;
}

if (resume.interests !== undefined) {
  resume.interests.forEach((profile) => {
    y = checkPageBreak(doc, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    const profileLine = `• ${profile.name} - `;
    const profileWidth = doc.getTextWidth(profileLine);
    doc.text(profileLine, margin, y);
    doc.setTextColor(...linkColor);
    doc.textWithLink(profile.url, margin + profileWidth, y, {
      url: profile.url,
    });
    doc.setTextColor(...textColor);
    y += 3.8;
  });
}

// Save PDF with dynamic path
const getFlag = (name) => {
  const args = process.argv.slice(2);
  const withEq = args.find((a) => a.startsWith(`${name}=`));
  if (withEq) return withEq.split("=", 2)[1];
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const sanitize = (s = "") =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const companyFlag = getFlag("--company");
const downloadsDir = path.join(os.homedir(), "Downloads");

// Ensure Downloads directory exists
if (!existsSync(downloadsDir)) {
  mkdirSync(downloadsDir, { recursive: true });
}

const fileName = `Sai_Krishna_Gadiraju_Resume${
  companyFlag ? `_${sanitize(companyFlag)}` : ""
}.pdf`;
const fullPath = path.join(downloadsDir, fileName);

doc.save(fullPath);
console.log(`✅ PDF saved to: ${fullPath}`);
