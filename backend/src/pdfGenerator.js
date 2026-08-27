import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.resolve(__dirname, '../../frontend/public/template.jpg');

export async function generateAppointmentPDF(appointment) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.27, 841.89]); // A4 Size in points
  const { width, height } = page.getSize();

  // Load and draw template background image if exists
  if (fs.existsSync(TEMPLATE_PATH)) {
    const imgBytes = fs.readFileSync(TEMPLATE_PATH);
    const img = await pdfDoc.embedJpg(imgBytes);
    page.drawImage(img, { x: 0, y: 0, width, height });
  } else {
    // White background fallback
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  }

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const navyColor = rgb(15 / 255, 78 / 255, 132 / 255);
  const textColor = rgb(29 / 255, 51 / 255, 71 / 255);

  // 1. Candidate Name next to 'Dear,' (Exact baseline Y=614.5 pt)
  page.drawText(String(appointment.fullName || ''), {
    x: 98,
    y: 614.5,
    size: 11,
    font: fontBold,
    color: navyColor,
  });

  // 2. Date next to 'Date:' (Exact baseline Y=614.5 pt)
  page.drawText(String(appointment.appointmentDate || '20/08/2026'), {
    x: 502,
    y: 614.5,
    size: 10.5,
    font: fontBold,
    color: navyColor,
  });

  // 3. Department & Position Title Banner
  const teamStr = appointment.team || appointment.department || 'Technical Team';
  const posStr = appointment.position || 'Core Member';
  const bannerText = `${teamStr} — ${posStr}`;
  
  page.drawText(bannerText, {
    x: width / 2 - (fontOblique.widthOfTextAtSize(bannerText, 11.5) / 2),
    y: 575,
    size: 11.5,
    font: fontOblique,
    color: navyColor,
  });

  // 4. Body Paragraph 1
  const p1 = `We are pleased to inform you that you have been appointed as the ${posStr} of the ${teamStr} for the academic year 2025–2026 at the Stats-O-Locked Club, VIT Bhopal University. Your appointment reflects our confidence in your skills, leadership qualities, and commitment to excellence.`;
  drawWrappedText(page, p1, 52, 545, 491, fontRegular, 10, 15, textColor);

  // 5. Section Heading
  page.drawText('Roles and Responsibilities:', {
    x: 52,
    y: 475,
    size: 10.5,
    font: fontBold,
    color: navyColor,
  });

  // 6. Bullet Points
  const bullets = [
    `Lead and execute key initiatives within the ${teamStr}.`,
    'Collaborate actively with team leads, faculty coordinators, and core members.',
    'Maintain accountability, adherence to deadlines, and high standards of work.',
    'Contribute positively to the growth, vision, and technical activities of the club.'
  ];

  let currentY = 455;
  for (const bullet of bullets) {
    page.drawText('•', { x: 55, y: currentY, size: 10, font: fontBold, color: textColor });
    page.drawText(bullet, { x: 68, y: currentY, size: 9.5, font: fontRegular, color: textColor });
    currentY -= 18;
  }

  // 7. Closing Paragraphs
  currentY -= 10;
  const p2 = 'We are confident that your dedication and vision will drive the team towards achieving excellence and creating meaningful experiences through its events.';
  drawWrappedText(page, p2, 52, currentY, 491, fontRegular, 9.8, 14.5, textColor);

  currentY -= 32;
  page.drawText('Congratulations and best wishes for your journey ahead.', {
    x: 52,
    y: currentY,
    size: 9.8,
    font: fontBold,
    color: textColor,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function drawWrappedText(page, text, startX, startY, maxWidth, font, fontSize, lineHeight, color) {
  const words = text.split(' ');
  let line = '';
  let y = startY;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && i > 0) {
      page.drawText(line.trim(), { x: startX, y, size: fontSize, font, color });
      line = words[i] + ' ';
      y -= lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim().length > 0) {
    page.drawText(line.trim(), { x: startX, y, size: fontSize, font, color });
  }
}
