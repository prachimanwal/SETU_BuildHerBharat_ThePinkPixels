import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import app from '../src/app';
import { ENV } from '../src/config/env';
import { User } from '../src/models/User';
import { UploadedResumeFile } from '../src/models/UploadedResumeFile';
import { Resume } from '../src/models/Resume';
import { Portfolio } from '../src/models/Portfolio';

async function buildRealPdfBuffer(lines: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    lines.forEach((line) => doc.fontSize(11).text(line));
    doc.end();
  });
}

async function buildRealDocxBuffer(lines: string[]): Promise<Buffer> {
  const doc = new DocxDocument({
    sections: [
      {
        children: lines.map(
          (line) =>
            new Paragraph({
              children: [new TextRun(line)]
            })
        )
      }
    ]
  });
  return Packer.toBuffer(doc);
}

function matchesFilter(doc: any, filter: any = {}): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [k, v] of Object.entries(filter)) {
    const actual = k.split('.').reduce((acc: any, p) => (acc == null ? undefined : acc[p]), doc);
    if (String(actual ?? '') !== String(v ?? '')) return false;
  }
  return true;
}

function attachInMemoryModel(Model: any, store: any[]) {
  const wrap = (doc: any) => {
    if (!doc._id) doc._id = new mongoose.Types.ObjectId();
    if (!doc.createdAt) doc.createdAt = new Date();
    doc.updatedAt = new Date();
    if (typeof doc.save !== 'function') {
      doc.save = async function () {
        this.updatedAt = new Date();
        const idx = store.findIndex((x) => String(x._id) === String(this._id));
        if (idx >= 0) store[idx] = this;
        else store.push(this);
        return this;
      };
    }
    if (typeof doc.toObject !== 'function') {
      doc.toObject = function () {
        const out: any = {};
        for (const [k, v] of Object.entries(this)) {
          if (typeof v !== 'function') out[k] = v;
        }
        return out;
      };
    }
    return doc;
  };

  const makeQuery = (items: any, single = false): any => {
    let selected = '';
    const applySelect = (item: any) => {
      if (!item) return item;
      const clone = { ...item };
      if (selected.includes('-fileData')) delete clone.fileData;
      if (selected.includes('-extractedText')) delete clone.extractedText;
      if (selected.includes('-passwordHash')) delete clone.passwordHash;
      return clone;
    };
    const q: any = {
      select(f: string) {
        selected += ` ${f}`;
        return q;
      },
      sort() {
        return q;
      },
      limit(n: number) {
        if (Array.isArray(items)) items = items.slice(0, n);
        return q;
      },
      then(resolve: any, reject: any) {
        const res = single ? applySelect(items) : items.map(applySelect);
        return Promise.resolve(res).then(resolve, reject);
      }
    };
    return q;
  };

  Model.prototype.save = async function () {
    const plain: any = this.toObject ? this.toObject() : { ...this };
    if (!plain._id) plain._id = new mongoose.Types.ObjectId();
    if (!plain.createdAt) plain.createdAt = new Date();
    plain.updatedAt = new Date();
    if (this.comparePassword) plain.comparePassword = this.comparePassword.bind(plain);
    wrap(plain);
    const idx = store.findIndex((x) => String(x._id) === String(plain._id));
    if (idx >= 0) store[idx] = plain;
    else store.push(plain);
    return plain;
  };
  Model.create = async (data: any) => new Model(data).save();
  Model.find = (f?: any) => makeQuery(store.filter((d) => matchesFilter(d, f)), false);
  Model.findOne = (f?: any) => makeQuery(store.find((d) => matchesFilter(d, f)) || null, true);
  Model.findById = (id: any) => makeQuery(store.find((d) => String(d._id) === String(id)) || null, true);
  Model.countDocuments = async (f?: any) => store.filter((d) => matchesFilter(d, f)).length;
  Model.findByIdAndDelete = async (id: any) => {
    const idx = store.findIndex((d) => String(d._id) === String(id));
    return idx >= 0 ? store.splice(idx, 1)[0] : null;
  };
}

function installInMemoryStores() {
  Object.defineProperty(mongoose.connection, 'readyState', {
    configurable: true,
    get: () => 1
  });
  attachInMemoryModel(User, []);
  attachInMemoryModel(UploadedResumeFile, []);
  attachInMemoryModel(Resume, []);
  attachInMemoryModel(Portfolio, []);
}

async function run() {
  console.log('=== SETU Resume Upload & Parsing Comprehensive Test Suite ===\n');

  let usingRealMongo = false;
  try {
    await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    usingRealMongo = true;
    console.log('  • Connected to MongoDB for live resume upload tests');
  } catch {
    console.log('  • Local MongoDB unavailable — using in-memory Mongoose store with real Express, Multer, pdf-parse & mammoth');
    installInMemoryStores();
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const { port } = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${port}`;

  const suffix = `resume_test_${Date.now()}`;
  const createdUserIds: mongoose.Types.ObjectId[] = [];
  const createdUploadIds: string[] = [];

  try {
    // Register User A & User B
    const regA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Sharma',
        email: `${suffix}_a@setu.test`,
        password: 'Password123!',
        role: 'seeker'
      })
    }).then((r) => r.json() as Promise<any>);
    const tokenA = regA.data.token;
    const userAId = regA.data.user._id || regA.data.user.id;
    createdUserIds.push(new mongoose.Types.ObjectId(userAId));

    const regB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Other Seeker',
        email: `${suffix}_b@setu.test`,
        password: 'Password123!',
        role: 'seeker'
      })
    }).then((r) => r.json() as Promise<any>);
    const tokenB = regB.data.token;
    createdUserIds.push(new mongoose.Types.ObjectId(regB.data.user._id || regB.data.user.id));

    // ------------------------------------------------------------------
    // TEST 1: Valid PDF Resume Upload, Real Parsing & Profile Confirm
    // ------------------------------------------------------------------
    const pdfBuffer = await buildRealPdfBuffer([
      'Ananya Sharma',
      'ananya.sharma@example.com | +91 9876543210',
      'Education',
      'B.Tech Computer Science - Delhi Technological University 2025 8.6 CGPA',
      'Skills',
      'Python, SQL, React, Excel, Power BI, Communication',
      'Work Experience',
      'Junior Data Analyst - FinBridge India - 2025',
      'Internships',
      'Analytics Intern - Bharat Insights - Summer 2024',
      'Projects',
      'Rural Market Demand Dashboard',
      'Built an interactive SQL and Power BI dashboard analyzing district trends.',
      'Certifications',
      'Google Data Analytics Professional Certificate',
      'Achievements',
      'Winner of Smart India Hackathon 2024 Regional Round'
    ]);

    const pdfForm = new FormData();
    pdfForm.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), 'ananya-resume.pdf');

    const idempKey = `pdf-key-${Date.now()}`;
    const pdfRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'X-Idempotency-Key': idempKey,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148'
      },
      body: pdfForm
    });
    const pdfJson: any = await pdfRes.json();
    assert.equal(pdfRes.status, 201, `Expected 201 for valid PDF, got ${pdfRes.status}: ${JSON.stringify(pdfJson)}`);
    assert.equal(pdfJson.data.versionNumber, 1);
    assert.equal(pdfJson.data.parseStatus, 'completed');
    assert.equal(pdfJson.data.shareWithEmployers, false, 'Must NEVER auto-share with employers');

    // Retry with same X-Idempotency-Key must NOT create a duplicate upload
    const dupRetryForm = new FormData();
    dupRetryForm.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), 'ananya-resume.pdf');
    const retryRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'X-Idempotency-Key': idempKey
      },
      body: dupRetryForm
    });
    const retryJson: any = await retryRes.json();
    assert.equal(String(retryJson.data.uploadId), String(pdfJson.data.uploadId), 'Retry with same idempotency key must deduplicate');

    // Status polling endpoint check (owner 200, other user 403)
    const statusOwner = await fetch(`${baseUrl}/api/resumes/upload/${pdfJson.data.uploadId}/status`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(statusOwner.status, 200);
    const statusOther = await fetch(`${baseUrl}/api/resumes/upload/${pdfJson.data.uploadId}/status`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.equal(statusOther.status, 403);
    assert.equal(pdfJson.data.extractedData.fullName, 'Ananya Sharma');
    assert.equal(pdfJson.data.extractedData.email, 'ananya.sharma@example.com');
    assert.ok(pdfJson.data.extractedData.skills.includes('Python'));
    assert.ok(pdfJson.data.extractedData.skills.includes('SQL'));
    assert.ok(pdfJson.data.extractedData.education.length >= 1);
    assert.ok(pdfJson.data.extractedData.workExperience.length >= 1);
    assert.ok(pdfJson.data.extractedData.internships.length >= 1);
    assert.ok(pdfJson.data.extractedData.projects.length >= 1);
    assert.ok(pdfJson.data.extractedData.certifications.length >= 1);
    assert.ok(pdfJson.data.extractedData.achievements.length >= 1);
    const pdfUploadId = pdfJson.data.uploadId;
    createdUploadIds.push(pdfUploadId);

    // Confirm edited data into user profile
    const confirmRes = await fetch(`${baseUrl}/api/resumes/upload/${pdfUploadId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ extractedData: pdfJson.data.extractedData })
    });
    assert.equal(confirmRes.status, 200);
    console.log('  ✓ 1. Valid PDF resume uploaded via multipart/form-data, parsed all 10 sections & merged cleanly');

    // ------------------------------------------------------------------
    // TEST 2: Valid DOCX Resume Upload & Version History Preservation
    // ------------------------------------------------------------------
    const docxBuffer = await buildRealDocxBuffer([
      'Ananya Sharma',
      'ananya.sharma@example.com | +91 9876543210',
      'Education',
      'B.Tech Information Technology 2025 84%',
      'Skills',
      'JavaScript, TypeScript, Node.js, MongoDB',
      'Internships',
      'Frontend Intern - Setu Labs',
      'Achievements',
      'Dean List Scholar 2024'
    ]);

    const docxForm = new FormData();
    docxForm.append(
      'file',
      new Blob([new Uint8Array(docxBuffer)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      'ananya-resume-v2.docx'
    );

    const docxRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: docxForm
    });
    const docxJson: any = await docxRes.json();
    assert.equal(docxRes.status, 201, `Expected 201 for valid DOCX, got ${docxRes.status}: ${JSON.stringify(docxJson)}`);
    assert.equal(docxJson.data.versionNumber, 2, 'Second upload must increment versionNumber while preserving v1');
    assert.ok(docxJson.data.extractedData.skills.includes('TypeScript'));
    assert.ok(docxJson.data.extractedData.internships.length >= 1);
    assert.ok(docxJson.data.extractedData.achievements.length >= 1);
    createdUploadIds.push(docxJson.data.uploadId);

    // Verify both versions exist in GET /api/resumes (no overwriting/deletion)
    const listRes = await fetch(`${baseUrl}/api/resumes`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    }).then((r) => r.json() as Promise<any>);
    assert.equal(listRes.data.uploadedFiles.length, 2, 'Both resume versions must be preserved');
    console.log('  ✓ 2. Valid DOCX resume uploaded, parsed & version history preserved (v1 + v2)');

    // ------------------------------------------------------------------
    // TEST 3: Invalid File Type (.txt)
    // ------------------------------------------------------------------
    const badTypeForm = new FormData();
    badTypeForm.append('file', new Blob(['hello plain text'], { type: 'text/plain' }), 'notes.txt');
    const badTypeRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: badTypeForm
    });
    const badTypeJson: any = await badTypeRes.json();
    assert.equal(badTypeRes.status, 400);
    assert.ok(badTypeJson.message.toLowerCase().includes('pdf and docx'));
    console.log('  ✓ 3. Invalid file type (.txt) cleanly rejected with HTTP 400 JSON');

    // ------------------------------------------------------------------
    // TEST 4: File Larger Than 5 MB
    // ------------------------------------------------------------------
    const oversizedBuf = Buffer.concat([
      Buffer.from('%PDF-1.4\n'),
      Buffer.alloc(5 * 1024 * 1024 + 200_000, 0x20)
    ]);
    const bigForm = new FormData();
    bigForm.append('file', new Blob([new Uint8Array(oversizedBuf)], { type: 'application/pdf' }), 'huge.pdf');
    const bigRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: bigForm
    });
    const bigJson: any = await bigRes.json();
    assert.equal(bigRes.status, 400);
    assert.ok(bigJson.message.toLowerCase().includes('5 mb'));
    console.log('  ✓ 4. File > 5 MB cleanly rejected with HTTP 400 JSON (no stack trace)');

    // ------------------------------------------------------------------
    // TEST 5: Empty Upload (missing file AND 0-byte file)
    // ------------------------------------------------------------------
    const noFileForm = new FormData();
    const noFileRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: noFileForm
    });
    assert.equal(noFileRes.status, 400);

    const zeroByteForm = new FormData();
    zeroByteForm.append('file', new Blob([], { type: 'application/pdf' }), 'empty.pdf');
    const zeroByteRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: zeroByteForm
    });
    const zeroByteJson: any = await zeroByteRes.json();
    assert.equal(zeroByteRes.status, 400);
    assert.ok(zeroByteJson.message.toLowerCase().includes('empty'));
    console.log('  ✓ 5. Empty upload (no file & 0-byte file) cleanly rejected with HTTP 400 JSON');

    // ------------------------------------------------------------------
    // TEST 6: Corrupted PDF & Corrupted DOCX
    // ------------------------------------------------------------------
    const corruptPdfForm = new FormData();
    corruptPdfForm.append(
      'file',
      new Blob(['NOT_A_REAL_PDF_GARBAGE_BYTES'], { type: 'application/pdf' }),
      'broken.pdf'
    );
    const corruptPdfRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: corruptPdfForm
    });
    const corruptPdfJson: any = await corruptPdfRes.json();
    assert.equal(corruptPdfRes.status, 400);
    assert.ok(corruptPdfJson.message.toLowerCase().includes('corrupt'));

    const corruptDocxForm = new FormData();
    corruptDocxForm.append(
      'file',
      new Blob([new Uint8Array(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0xff]))], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      'broken.docx'
    );
    const corruptDocxRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: corruptDocxForm
    });
    assert.equal(corruptDocxRes.status, 400);
    console.log('  ✓ 6. Corrupted PDF & corrupted DOCX cleanly rejected with HTTP 400 JSON');

    // ------------------------------------------------------------------
    // TEST 7: Unauthenticated Upload + Cross-User Privacy Isolation
    // ------------------------------------------------------------------
    const unauthForm = new FormData();
    unauthForm.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), 'unauth.pdf');
    const unauthRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      body: unauthForm
    });
    assert.equal(unauthRes.status, 401);

    // User B cannot download or confirm User A's private resume
    const otherDownload = await fetch(`${baseUrl}/api/resumes/upload/${pdfUploadId}/download`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.equal(otherDownload.status, 403, 'Other users must NEVER download another user’s private resume');

    // Owner A can download their own private resume
    const ownerDownload = await fetch(`${baseUrl}/api/resumes/upload/${pdfUploadId}/download`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(ownerDownload.status, 200);
    assert.equal(ownerDownload.headers.get('cache-control'), 'private, no-store');

    // Regression guard: malformed JSON body never leaks raw "Unexpected token" parser error
    const badJsonRes = await fetch(`${baseUrl}/api/resumes/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: '------WebKitFormBoundaryFakePayload'
    });
    const badJsonBody: any = await badJsonRes.json();
    assert.equal(badJsonRes.status, 400);
    assert.ok(!badJsonBody.message.includes('Unexpected token'), 'Must never leak raw JSON.parse error to user');

    // MongoDB unavailable check (readyState = 0 -> HTTP 503 structured JSON)
    if (!usingRealMongo) {
      Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, get: () => 0 });
      const dbDownForm = new FormData();
      dbDownForm.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), 'dbdown.pdf');
      const dbDownRes = await fetch(`${baseUrl}/api/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: dbDownForm
      });
      assert.equal(dbDownRes.status, 503);
      Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, get: () => 1 });
    }
    console.log('  ✓ 7. Unauthenticated (401), cross-user privacy (403), DB unavailable (503), idempotent retries & clean error masking verified');

    console.log('\n✅ ALL 7 RESUME UPLOAD, PARSING & SECURITY TESTS PASSED!');
  } finally {
    if (usingRealMongo) {
      for (const uid of createdUploadIds) {
        await UploadedResumeFile.findByIdAndDelete(uid).catch(() => {});
      }
      if (createdUserIds.length > 0) {
        await Portfolio.deleteMany({ userId: { $in: createdUserIds } }).catch(() => {});
        await User.deleteMany({ _id: { $in: createdUserIds } }).catch(() => {});
      }
      await mongoose.disconnect().catch(() => {});
    }
    server.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Resume upload test failed:', err);
  process.exit(1);
});
