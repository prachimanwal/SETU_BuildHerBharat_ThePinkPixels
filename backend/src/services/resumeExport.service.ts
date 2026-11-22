import PDFDocument from 'pdfkit';
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle
} from 'docx';
import { IResume } from '../models/Resume';

const TEMPLATE_ACCENTS: Record<string, string> = {
  ats_professional: '#1E3A5F',
  modern_minimal: '#2589D6',
  student_fresher: '#0F766E',
  creative_professional: '#BE185D'
};

/**
 * Generates a clean, selectable-text PDF buffer (never image-only) using PDFKit.
 */
export function generateResumePdfBuffer(resume: IResume): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 46,
      info: {
        Title: `${resume.personalInfo?.fullName || 'Resume'} - ${resume.versionName}`,
        Author: resume.personalInfo?.fullName || 'SETU Member',
        Creator: 'SETU Resume Builder'
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const accent = TEMPLATE_ACCENTS[resume.template] || '#1E3A5F';
    const pi = resume.personalInfo || ({} as any);

    // Header
    doc
      .fillColor(accent)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(pi.fullName || 'Your Name', {
        align: resume.template === 'modern_minimal' ? 'left' : 'center'
      });

    const contactParts = [
      pi.email,
      pi.phone,
      [pi.city, pi.state].filter(Boolean).join(', ')
    ].filter(Boolean);

    const linkParts = [pi.linkedinUrl, pi.githubUrl, pi.portfolioUrl].filter(Boolean);

    if (contactParts.length > 0) {
      doc
        .moveDown(0.25)
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(9.5)
        .text(contactParts.join('  |  '), {
          align: resume.template === 'modern_minimal' ? 'left' : 'center'
        });
    }
    if (linkParts.length > 0) {
      doc
        .fillColor('#2589D6')
        .fontSize(9)
        .text(linkParts.join('  |  '), {
          align: resume.template === 'modern_minimal' ? 'left' : 'center'
        });
    }

    doc.moveDown(0.6);
    doc
      .strokeColor('#CBD5E1')
      .lineWidth(1)
      .moveTo(46, doc.y)
      .lineTo(549, doc.y)
      .stroke();
    doc.moveDown(0.6);

    const addSectionHeading = (title: string) => {
      doc.moveDown(0.35);
      doc.fillColor(accent).font('Helvetica-Bold').fontSize(11).text(title.toUpperCase());
      doc
        .strokeColor(accent)
        .lineWidth(0.7)
        .moveTo(46, doc.y + 1)
        .lineTo(549, doc.y + 1)
        .stroke();
      doc.moveDown(0.35);
      doc.fillColor('#1E293B').font('Helvetica').fontSize(9.5);
    };

    const order =
      Array.isArray(resume.sectionOrder) && resume.sectionOrder.length > 0
        ? resume.sectionOrder
        : ['summary', 'education', 'skills', 'projects', 'experience', 'certifications'];

    for (const section of order) {
      if (section === 'summary' && resume.careerObjective?.summary?.trim()) {
        addSectionHeading('Professional Summary');
        doc.text(resume.careerObjective.summary.trim(), { lineGap: 2 });
      }

      if (section === 'education' && Array.isArray(resume.education) && resume.education.length > 0) {
        addSectionHeading('Education');
        resume.education.forEach((ed) => {
          const titleLine = [ed.degree || ed.qualification, ed.specialization]
            .filter(Boolean)
            .join(' — ');
          const subLine = [
            ed.institution,
            [ed.startYear, ed.graduationYear].filter(Boolean).join(' – '),
            ed.score
          ]
            .filter(Boolean)
            .join('  |  ');
          doc.font('Helvetica-Bold').text(titleLine || 'Qualification');
          if (subLine) {
            doc.font('Helvetica').fillColor('#475569').text(subLine);
            doc.fillColor('#1E293B');
          }
          doc.moveDown(0.25);
        });
      }

      if (section === 'skills' && Array.isArray(resume.skills) && resume.skills.length > 0) {
        addSectionHeading('Skills');
        const verified = resume.skills.filter((s) => s.verified);
        const selfRep = resume.skills.filter((s) => !s.verified);
        if (verified.length > 0) {
          doc
            .font('Helvetica-Bold')
            .text('SETU Assessment-Verified Skills: ', { continued: true })
            .font('Helvetica')
            .text(
              verified
                .map((s) =>
                  typeof s.assessmentScore === 'number'
                    ? `${s.name} (${s.assessmentScore}%)`
                    : s.name
                )
                .join(', ')
            );
        }
        if (selfRep.length > 0) {
          doc
            .font('Helvetica-Bold')
            .text('Additional Skills: ', { continued: true })
            .font('Helvetica')
            .text(selfRep.map((s) => s.name).join(', '));
        }
      }

      if (
        section === 'projects' &&
        resume.hasProjects &&
        Array.isArray(resume.projects) &&
        resume.projects.length > 0
      ) {
        addSectionHeading('Projects');
        resume.projects.forEach((p) => {
          const meta = [p.role, p.projectType, p.duration].filter(Boolean).join(' | ');
          doc.font('Helvetica-Bold').text(`${p.title}${meta ? `  (${meta})` : ''}`);
          if (p.description) {
            doc.font('Helvetica').text(p.description, { lineGap: 1.5 });
          }
          if (Array.isArray(p.technologies) && p.technologies.length > 0) {
            doc
              .fillColor('#475569')
              .fontSize(8.8)
              .text(`Technologies: ${p.technologies.join(', ')}`);
          }
          const pLinks = [p.projectLink, p.githubLink].filter(Boolean).join(' | ');
          if (pLinks) {
            doc.fillColor('#2589D6').fontSize(8.8).text(pLinks);
          }
          doc.fillColor('#1E293B').fontSize(9.5).moveDown(0.3);
        });
      }

      if (
        section === 'experience' &&
        resume.hasWorkExperience &&
        Array.isArray(resume.workExperience) &&
        resume.workExperience.length > 0
      ) {
        addSectionHeading('Work Experience');
        resume.workExperience.forEach((exp) => {
          const dates = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate]
            .filter(Boolean)
            .join(' – ');
          doc
            .font('Helvetica-Bold')
            .text(`${exp.jobTitle} — ${exp.companyName}${dates ? ` (${dates})` : ''}`);
          if (exp.responsibilities) {
            doc.font('Helvetica').text(exp.responsibilities, { lineGap: 1.5 });
          }
          if (exp.achievements) {
            doc.font('Helvetica-Oblique').text(`Key Achievement: ${exp.achievements}`);
            doc.font('Helvetica');
          }
          doc.moveDown(0.3);
        });
      }

      if (
        section === 'certifications' &&
        ((resume.certifications && resume.certifications.length > 0) ||
          (resume.awards && resume.awards.length > 0) ||
          (resume.volunteering && resume.volunteering.length > 0))
      ) {
        addSectionHeading('Certifications & Achievements');
        (resume.certifications || []).forEach((c) => {
          const line = [c.name, c.organization, c.completionDate].filter(Boolean).join(' — ');
          doc.font('Helvetica').text(`• ${line}`);
        });
        (resume.awards || []).filter(Boolean).forEach((aw) => {
          doc.font('Helvetica').text(`• Award: ${aw}`);
        });
        (resume.volunteering || []).filter(Boolean).forEach((vol) => {
          doc.font('Helvetica').text(`• Volunteering: ${vol}`);
        });
      }
    }

    doc.end();
  });
}

/**
 * Generates a real, editable, selectable-text .docx Word document buffer using `docx`.
 */
export async function generateResumeDocxBuffer(resume: IResume): Promise<Buffer> {
  const pi = resume.personalInfo || ({} as any);
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: pi.fullName || 'Your Name',
          bold: true,
          size: 34,
          color: '1E3A5F'
        })
      ]
    })
  );

  const contactLine = [
    pi.email,
    pi.phone,
    [pi.city, pi.state].filter(Boolean).join(', ')
  ]
    .filter(Boolean)
    .join('  |  ');

  if (contactLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: contactLine, size: 20, color: '475569' })]
      })
    );
  }

  const linksLine = [pi.linkedinUrl, pi.githubUrl, pi.portfolioUrl].filter(Boolean).join('  |  ');
  if (linksLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: linksLine, size: 18, color: '2589D6' })]
      })
    );
  }

  const pushHeading = (heading: string) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 80 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'BDE0FE' }
        },
        children: [
          new TextRun({ text: heading.toUpperCase(), bold: true, size: 22, color: '1E3A5F' })
        ]
      })
    );
  };

  const order =
    Array.isArray(resume.sectionOrder) && resume.sectionOrder.length > 0
      ? resume.sectionOrder
      : ['summary', 'education', 'skills', 'projects', 'experience', 'certifications'];

  for (const section of order) {
    if (section === 'summary' && resume.careerObjective?.summary?.trim()) {
      pushHeading('Professional Summary');
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: resume.careerObjective.summary.trim(), size: 20 })]
        })
      );
    }

    if (section === 'education' && resume.education?.length) {
      pushHeading('Education');
      resume.education.forEach((ed) => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: [ed.degree || ed.qualification, ed.specialization].filter(Boolean).join(' — '),
                bold: true,
                size: 20
              })
            ]
          })
        );
        const detail = [
          ed.institution,
          [ed.startYear, ed.graduationYear].filter(Boolean).join(' - '),
          ed.score
        ]
          .filter(Boolean)
          .join(' | ');
        if (detail) {
          children.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: detail, size: 19, color: '475569' })]
            })
          );
        }
      });
    }

    if (section === 'skills' && resume.skills?.length) {
      pushHeading('Skills');
      const verified = resume.skills.filter((s) => s.verified);
      const selfRep = resume.skills.filter((s) => !s.verified);
      if (verified.length) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'SETU Assessment-Verified Skills: ', bold: true, size: 20 }),
              new TextRun({
                text: verified
                  .map((s) =>
                    typeof s.assessmentScore === 'number'
                      ? `${s.name} (${s.assessmentScore}%)`
                      : s.name
                  )
                  .join(', '),
                size: 20
              })
            ]
          })
        );
      }
      if (selfRep.length) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Additional Skills: ', bold: true, size: 20 }),
              new TextRun({ text: selfRep.map((s) => s.name).join(', '), size: 20 })
            ]
          })
        );
      }
    }

    if (section === 'projects' && resume.hasProjects && resume.projects?.length) {
      pushHeading('Projects');
      resume.projects.forEach((p) => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: p.title, bold: true, size: 20 }),
              new TextRun({
                text: [p.role, p.projectType, p.duration].filter(Boolean).length
                  ? ` (${[p.role, p.projectType, p.duration].filter(Boolean).join(' | ')})`
                  : '',
                size: 19,
                color: '475569'
              })
            ]
          })
        );
        if (p.description) {
          children.push(
            new Paragraph({
              spacing: { after: 50 },
              children: [new TextRun({ text: p.description, size: 20 })]
            })
          );
        }
        if (p.technologies?.length) {
          children.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: `Technologies: ${p.technologies.join(', ')}`,
                  italics: true,
                  size: 18,
                  color: '475569'
                })
              ]
            })
          );
        }
      });
    }

    if (section === 'experience' && resume.hasWorkExperience && resume.workExperience?.length) {
      pushHeading('Work Experience');
      resume.workExperience.forEach((exp) => {
        const dates = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate]
          .filter(Boolean)
          .join(' - ');
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${exp.jobTitle} — ${exp.companyName}${dates ? ` (${dates})` : ''}`,
                bold: true,
                size: 20
              })
            ]
          })
        );
        if (exp.responsibilities) {
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: exp.responsibilities, size: 20 })]
            })
          );
        }
        if (exp.achievements) {
          children.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({ text: `Achievements: ${exp.achievements}`, italics: true, size: 19 })
              ]
            })
          );
        }
      });
    }

    if (
      section === 'certifications' &&
      (resume.certifications?.length || resume.awards?.length || resume.volunteering?.length)
    ) {
      pushHeading('Certifications & Achievements');
      (resume.certifications || []).forEach((c) => {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: `• ${[c.name, c.organization, c.completionDate].filter(Boolean).join(' — ')}`,
                size: 20
              })
            ]
          })
        );
      });
      (resume.awards || []).filter(Boolean).forEach((aw) => {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [new TextRun({ text: `• Award: ${aw}`, size: 20 })]
          })
        );
      });
      (resume.volunteering || []).filter(Boolean).forEach((vol) => {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [new TextRun({ text: `• Volunteering: ${vol}`, size: 20 })]
          })
        );
      });
    }
  }

  const doc = new DocxDocument({
    sections: [{ children }]
  });
  return Packer.toBuffer(doc);
}
