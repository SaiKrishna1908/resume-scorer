import { Resume } from "../entity/resume";
import { jsPDF } from "jspdf";
import os from "os";
import path from "path";
import { existsSync, mkdirSync } from "fs";

export const generateResumePDF = async (
  companyName?: string
): Promise<{ filePath: string; message: string }> => {
  const resumeInstance = Resume.getInstance();
  const resume = await resumeInstance.getResume();

  if (!resume || !resume.basics) {
    throw new Error(
      "Resume data is not available. Please update the resume first."
    );
  }

  const doc = new jsPDF();
  const margin = 10;
  let y = margin;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const headingColor: [number, number, number] = [0, 51, 102];
  const subHeadingColor: [number, number, number] = [51, 51, 51];
  const linkColor: [number, number, number] = [0, 0, 255];
  const textColor: [number, number, number] = [0, 0, 0];

  // Helper functions
  const drawSectionDivider = (yPos: number) => {
    const lineMargin = 10;
    doc.setDrawColor(200);
    doc.line(lineMargin, yPos, pageWidth - lineMargin, yPos);
  };

  const checkPageBreak = (currentY: number, buffer = 10): number => {
    if (currentY + buffer > pageHeight) {
      doc.addPage();
      return margin;
    }
    return currentY;
  };

  const formatDateToMonthYear = (dateStr: string): string => {
    if (dateStr === "Current" || dateStr === "Present") {
      return dateStr;
    }
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...headingColor);
  const nameWidth = doc.getTextWidth(resume.basics.name);
  doc.text(resume.basics.name, (pageWidth - nameWidth) / 2, y);
  y += 6;

  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...subHeadingColor);
  const labelWidth = doc.getTextWidth(resume.basics.label);
  doc.text(resume.basics.label, (pageWidth - labelWidth) / 2, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  const contactLine = `${resume.basics.phone} | ${resume.basics.email} | ${resume.basics.location.city}, ${resume.basics.location.countryCode}`;
  const contactWidth = doc.getTextWidth(contactLine);
  doc.text(contactLine, (pageWidth - contactWidth) / 2, y);

  if (resume.basics.profiles && resume.basics.profiles.length > 0) {
    y += 5;
    const linksLine = resume.basics.profiles[0].url;
    const linksWidth = doc.getTextWidth(linksLine);
    doc.text(linksLine, (pageWidth - linksWidth) / 2, y);
  }

  drawSectionDivider(y + 2);
  y += 7;

  // Summary
  y = checkPageBreak(y);
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
    .filter((word: string) => word.length > 0);
  let currentLine = "";
  let lineStartY = y;

  words.forEach((word: string) => {
    const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);

    if (testWidth > maxLineWidth) {
      if (currentLine.length > 0) {
        lineStartY = checkPageBreak(lineStartY, 4);
        doc.text(currentLine, margin, lineStartY);
        lineStartY += 4;
      }
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine.length > 0) {
    lineStartY = checkPageBreak(lineStartY, 4);
    doc.text(currentLine, margin, lineStartY);
    lineStartY += 4;
  }

  y = lineStartY - 4;
  drawSectionDivider(y + 2);
  y += 7;

  // Skills
  y = checkPageBreak(y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...headingColor);
  doc.text("SKILLS", margin, y);
  y += 6;

  resume.skills.forEach((skill: any) => {
    if (skill.keywords.length > 0) {
      y = checkPageBreak(y, 10);

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

      skill.keywords.forEach((keyword: string, index: number) => {
        const keywordText =
          index < skill.keywords.length - 1 ? `${keyword}, ` : keyword;
        const keywordWidth = doc.getTextWidth(keywordText);

        if (currentX + keywordWidth > pageWidth - margin) {
          doc.text(currentLine.trim(), startX, y);
          y += 4;
          y = checkPageBreak(y);
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
  y = checkPageBreak(y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...headingColor);
  doc.text("PROFESSIONAL EXPERIENCE", margin, y);
  y += 6;

  resume.work.forEach((job: any) => {
    y = checkPageBreak(y, 10);
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

    job.highlights.forEach((point: string) => {
      const lines = doc.splitTextToSize(
        `• ${point}`,
        pageWidth - 2 * margin - 4
      );
      lines.forEach((line: string) => {
        y = checkPageBreak(y);
        doc.text(line, margin, y);
        y += 4;
      });
    });

    y += 3;
  });

  y -= 4;

  // Education
  if (resume.education) {
    drawSectionDivider(y + 2);
    y += 7;

    y = checkPageBreak(y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...headingColor);
    doc.text("EDUCATION", margin, y);
    y += 6;

    resume.education.forEach((edu: any) => {
      y = checkPageBreak(y);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...subHeadingColor);
      doc.text(`${edu.studyType} in ${edu.area}`, margin, y);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      const educationDetails = edu.institution;
      doc.text(
        educationDetails,
        pageWidth - margin - doc.getTextWidth(educationDetails),
        y
      );
      y += 4;
    });

    y -= 4;
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    drawSectionDivider(y + 2);
    y += 7;
    y = checkPageBreak(y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...headingColor);
    doc.text("PROJECTS", margin, y);
    y += 6;

    resume.projects.forEach((project: any) => {
      y = checkPageBreak(y);
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
      wrappedDescription.forEach((line: string) => {
        y = checkPageBreak(y);
        doc.text(line, margin, y);
        y += 5;
      });

      (project.highlights || []).forEach((pt: string) => {
        const lines = doc.splitTextToSize(
          `• ${pt}`,
          pageWidth - 2 * margin - 4
        );
        lines.forEach((line: string) => {
          y = checkPageBreak(y);
          doc.text(line, margin + 4, y);
          y += 4.0;
        });
      });

      y += 2;
    });

    y -= 6;
    drawSectionDivider(y + 2);
    y += 7;
  }

  // Certifications
  if (resume.certificates) {
    y = checkPageBreak(y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...headingColor);
    doc.text("CERTIFICATIONS", margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    resume.certificates.forEach((cert: any) => {
      y = checkPageBreak(y);
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

  // Programming Profiles
  if (resume.interests && resume.interests.length > 0) {
    drawSectionDivider(y + 2);
    y += 7;

    y = checkPageBreak(y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...headingColor);
    doc.text("PROGRAMMING PROFILES", margin, y);
    y += 6;

    resume.interests.forEach((profile: any) => {
      y = checkPageBreak(y);
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

  // Save PDF
  const sanitize = (s = "") =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const downloadsDir = path.join(os.homedir(), "Downloads");

  if (!existsSync(downloadsDir)) {
    mkdirSync(downloadsDir, { recursive: true });
  }

  const fileName = `${resume.basics.name.replace(/\s+/g, "_")}_Resume${
    companyName ? `_${sanitize(companyName)}` : ""
  }.pdf`;
  const fullPath = path.join(downloadsDir, fileName);

  doc.save(fullPath);

  return {
    filePath: fullPath,
    message: `Resume PDF successfully generated at ${fullPath}`,
  };
};
