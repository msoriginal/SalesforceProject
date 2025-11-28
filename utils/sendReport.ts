import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import archiver from 'archiver';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const RESULTS_JSON = path.resolve(process.cwd(), 'test-results', 'results.json');
const HTML_REPORT_DIR = path.resolve(process.cwd(), 'playwright-report');
const REPORT_ZIP = path.resolve(process.cwd(), 'playwright-report.zip');

async function zipReportDir(srcDir: string, outPath: string) {
  if (!fs.existsSync(srcDir)) return false;
  const output = fs.createWriteStream(outPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);
  archive.directory(srcDir, false);

  await new Promise<void>((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    // start finalize after listeners are attached
    archive.finalize().catch(reject);
  });

  return true;
}

function buildSummary(resultsPath: string) {
  if (!fs.existsSync(resultsPath)) return { ok: false, message: 'Results file not found' };

  const raw = fs.readFileSync(resultsPath, 'utf8');
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, message: 'Failed to parse results JSON' };
  }

  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let duration = 0;

  const tests = parsed['tests'] || parsed;
  function walkTests(node: any) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walkTests);
      return;
    }
    if (node.title && node.status) {
      total++;
      const s = node.status.toLowerCase();
      if (s === 'passed') passed++;
      else if (s === 'failed') failed++;
      else if (s === 'skipped') skipped++;
      if (typeof node.duration === 'number') duration += node.duration;
      return;
    }
    if (node.entries) walkTests(node.entries);
    if (node.tests) walkTests(node.tests);
    if (node.suites) walkTests(node.suites);
  }
  walkTests(tests);

  return {
    ok: true,
    total,
    passed,
    failed,
    skipped,
    durationMs: duration,
    raw: parsed
  };
}

async function sendEmail(subject: string, htmlBody: string, attachments: Array<{ filename: string; path: string }>) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_TO;

  if (!host || !user || !pass || !from || !to) {
    throw new Error('Missing SMTP or email env vars (SMTP_HOST/SMTP_USER/SMTP_PASS/EMAIL_FROM/EMAIL_TO).');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html: htmlBody,
    attachments
  });
  return info;
}

(async () => {
  try {
    const summary = buildSummary(RESULTS_JSON);
    

    let html = '';
    if (!summary.ok) {
      html = `<p><strong>Report generator error:</strong> ${summary.message}</p>`;
    } else {
      html = `
        <h2>Test Run Summary</h2>
        <ul>
          <li>Total tests: ${summary.total}</li>
          <li>Passed: ${summary.passed}</li>
          <li>Failed: ${summary.failed}</li>
          <li>Skipped: ${summary.skipped}</li>
          <li>Duration (ms): ${summary.durationMs}</li>
        </ul>
      `;
      if (summary?.failed??0 > 0) {
        html += `<p style="color:red"><strong>Some tests failed</strong></p>`;
      } else {
        html += `<p style="color:green"><strong>All tests passed</strong></p>`;
      }
    }

    let zipped = false;
    if (fs.existsSync(HTML_REPORT_DIR)) {
      console.log('Zipping HTML report...');
      zipped = await zipReportDir(HTML_REPORT_DIR, REPORT_ZIP);
    }

    const attachments: Array<{ filename: string; path: string }> = [];
    if (fs.existsSync(RESULTS_JSON)) attachments.push({ filename: path.basename(RESULTS_JSON), path: RESULTS_JSON });
    if (zipped && fs.existsSync(REPORT_ZIP)) attachments.push({ filename: path.basename(REPORT_ZIP), path: REPORT_ZIP });

    const subject = `Playwright Test Report - ${summary.ok ? `${summary.passed}/${summary.total} passed` : 'error'}`;

    console.log('Sending email...');
    const info = await sendEmail(subject, html, attachments);
    console.log('Email sent:', info.messageId);

  } catch (err: any) {
    console.error('Failed to send report email:', err.message || err);
    process.exit(1);
  }
})();
