import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Assessment } from '../src/models/Assessment';
import { AssessmentResult } from '../src/models/AssessmentResult';
import { LearningResource } from '../src/models/LearningResource';
import { LearningProgress } from '../src/models/LearningProgress';
import { GovernmentScheme } from '../src/models/GovernmentScheme';
import { Opportunity } from '../src/models/Opportunity';
import { Application } from '../src/models/Application';
import { Portfolio } from '../src/models/Portfolio';
import { ASSESSMENTS_CATALOG } from '../src/seed/data/assessmentsData';
import { LEARNING_CATALOG } from '../src/seed/data/learningData';
import { GOVERNMENT_SCHEMES_CATALOG } from '../src/seed/data/schemesData';

interface HttpResult {
  status: number;
  body: any;
  cookies: Record<string, string>;
}

function request(
  port: number,
  method: string,
  path: string,
  options: { body?: any; cookie?: string } = {}
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const payload = options.body !== undefined ? JSON.stringify(options.body) : undefined;
    const headers: Record<string, string> = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }
    if (options.cookie) headers.Cookie = options.cookie;

    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        const setCookies = (res.headers['set-cookie'] as string[]) || [];
        const cookies: Record<string, string> = {};
        for (const c of setCookies) {
          const [pair] = c.split(';');
          const eq = pair.indexOf('=');
          if (eq > 0) cookies[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
        }
        let body: any = raw;
        try {
          body = JSON.parse(raw);
        } catch {}
        resolve({ status: res.statusCode || 0, body, cookies });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function makeQuery(value: any) {
  const q: any = {
    select: () => q,
    populate: () => q,
    sort: () => q,
    skip: () => q,
    limit: () => q,
    lean: () => q,
    then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(value).catch(reject)
  };
  return q;
}

async function run() {
  console.log('=== SETU Full-Platform Verification Suite (Phases 1–6) ===\n');

  // In-memory store backed by the exact production catalogs
  const users: any[] = [];
  const assessments = ASSESSMENTS_CATALOG.map((a) => ({
    ...a,
    _id: new mongoose.Types.ObjectId(),
    toObject() {
      return { ...this };
    }
  }));
  const learningResources = LEARNING_CATALOG.map((l) => ({
    ...l,
    _id: new mongoose.Types.ObjectId(),
    toObject() {
      return { ...this };
    }
  }));
  const schemes = GOVERNMENT_SCHEMES_CATALOG.map((s) => ({
    ...s,
    _id: new mongoose.Types.ObjectId(),
    toObject() {
      return { ...this };
    }
  }));
  const opportunities: any[] = [
    {
      _id: new mongoose.Types.ObjectId(),
      employerId: new mongoose.Types.ObjectId(),
      title: 'Junior Python & SQL Analyst',
      organisationName: 'Verified Test Analytics Ltd',
      description: 'Entry-level analytics role for Python and SQL graduates.',
      requiredSkills: ['Python', 'SQL', 'Excel'],
      location: { city: 'Jaipur', state: 'Rajasthan', isRuralFocus: false },
      workMode: 'remote',
      opportunityType: 'job',
      stipendOrSalary: '₹4.5 - 6 LPA',
      minAcademicPercentage: 75,
      isCareerRestart: true,
      status: 'published',
      moderationStatus: 'clean',
      toObject() {
        return { ...this };
      }
    }
  ];
  const assessmentResults: any[] = [];
  const learningProgresses: any[] = [];
  const portfolios: any[] = [];
  const applications: any[] = [];

  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

  (User.prototype as any).save = async function () {
    const idx = users.findIndex((u) => u._id.toString() === this._id.toString());
    if (idx >= 0) users[idx] = this;
    else users.push(this);
    return this;
  };
  (User as any).findOne = (q: any) =>
    makeQuery(users.find((u) => (q.email ? u.email === q.email : false)) || null);
  (User as any).findById = (id: any) =>
    makeQuery(users.find((u) => u._id.toString() === String(id)) || null);

  (Assessment as any).find = () => makeQuery(assessments);
  (Assessment as any).findOne = (q: any) =>
    makeQuery(assessments.find((a) => !q?._id?.$ne || a._id.toString() !== String(q._id.$ne)) || null);
  (Assessment as any).findById = (id: any) =>
    makeQuery(assessments.find((a) => a._id.toString() === String(id)) || null);

  (AssessmentResult.prototype as any).save = async function () {
    assessmentResults.unshift(this);
    return this;
  };
  (AssessmentResult as any).find = (q: any) =>
    makeQuery(
      assessmentResults.filter((r) => {
        if (q?.userId && r.userId.toString() !== String(q.userId)) return false;
        if (q?.passed !== undefined && r.passed !== q.passed) return false;
        return true;
      })
    );

  (LearningResource as any).find = () => makeQuery(learningResources);
  (LearningResource as any).findById = (id: any) =>
    makeQuery(learningResources.find((l) => l._id.toString() === String(id)) || null);

  (LearningProgress.prototype as any).save = async function () {
    const idx = learningProgresses.findIndex(
      (p) =>
        p.userId.toString() === this.userId.toString() &&
        p.resourceId.toString() === this.resourceId.toString()
    );
    if (idx >= 0) learningProgresses[idx] = this;
    else learningProgresses.push(this);
    return this;
  };
  (LearningProgress as any).find = (q: any) =>
    makeQuery(learningProgresses.filter((p) => p.userId.toString() === String(q.userId)));
  (LearningProgress as any).findOne = (q: any) =>
    makeQuery(
      learningProgresses.find(
        (p) =>
          p.userId.toString() === String(q.userId) &&
          p.resourceId.toString() === String(q.resourceId)
      ) || null
    );

  (Portfolio.prototype as any).save = async function () {
    portfolios.push(this);
    return this;
  };
  (Portfolio as any).find = (q: any) =>
    makeQuery(portfolios.filter((p) => p.userId.toString() === String(q.userId)));
  (Portfolio as any).findOne = (q: any) =>
    makeQuery(
      portfolios.find(
        (p) => p.userId.toString() === String(q.userId) && p.title === q.title
      ) || null
    );

  (GovernmentScheme as any).find = () => makeQuery(schemes);
  (GovernmentScheme as any).findById = (id: any) =>
    makeQuery(schemes.find((s) => s._id.toString() === String(id)) || null);

  (Opportunity as any).countDocuments = async () => opportunities.length;
  (Opportunity as any).find = (q: any) => {
    if (q?._id?.$in) {
      const idSet = new Set(q._id.$in.map((x: any) => String(x)));
      return makeQuery(opportunities.filter((o) => idSet.has(o._id.toString())));
    }
    return makeQuery(opportunities);
  };
  (Opportunity as any).findById = (id: any) =>
    makeQuery(opportunities.find((o) => o._id.toString() === String(id)) || null);

  (Application as any).find = () => makeQuery(applications);

  const server = await new Promise<http.Server>((resolve) => {
    const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
  });
  const port = (server.address() as any).port;

  try {
    // Register & build rich seeker profile
    const reg = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Kavya Sharma',
        email: 'kavya.platform.test@example.com',
        password: 'StrongPassword@2026',
        role: 'seeker'
      }
    });
    assert.equal(reg.status, 201);
    const cookie = `setu_token=${reg.cookies.setu_token}`;

    // Phase 1: Profile with CGPA & Percentage
    const profRes = await request(port, 'PUT', '/api/profile', {
      cookie,
      body: {
        seekerProfile: {
          location: { city: 'Jaipur', state: 'Rajasthan', country: 'India', isRural: false },
          dateOfBirth: '2004-06-15',
          education: [
            {
              level: 'Undergraduate student',
              degree: 'B.Tech',
              specialization: 'Computer Science',
              institution: 'MNIT Jaipur',
              currentYear: '3rd Year',
              currentSemester: 'Semester 6',
              expectedGraduationYear: '2027',
              status: 'Pursuing',
              scoreType: 'CGPA',
              cgpa: 8.6,
              cgpaScale: 10
            },
            {
              level: 'Class 12 completed',
              board: 'CBSE',
              stream: 'Science',
              graduationYear: '2023',
              status: 'Completed',
              scoreType: 'Percentage',
              percentage: 89
            }
          ],
          detailedSkills: [
            { name: 'Python', category: 'Technical', proficiency: 'Intermediate' },
            { name: 'SQL', category: 'Technical', proficiency: 'Beginner' }
          ],
          interests: ['Software & Web Development', 'Data & AI'],
          careerGoalsList: ['Get my first job', 'Build verified skills'],
          employmentPreferences: {
            jobTypes: ['Full-time', 'Internship'],
            workModes: ['Remote', 'Hybrid']
          }
        }
      }
    });
    assert.equal(profRes.status, 200);
    assert.equal(profRes.body.data.user.seekerProfile.education[0].cgpa, 8.6);
    console.log('  ✓ Phase 1: Profile with CGPA/Percentage & Pursuing/Completed saved');

    // Phase 2: Skill Assessments catalog, hidden answers, scoring & verified badge
    const assList = await request(port, 'GET', '/api/assessments', { cookie });
    assert.equal(assList.status, 200);
    assert.equal(assList.body.data.length, ASSESSMENTS_CATALOG.length);
    const pythonAss = assList.body.data.find((a: any) => a.slug === 'python-fundamentals');
    assert.ok(pythonAss, 'Python Fundamentals assessment must exist');
    assert.equal(
      pythonAss.questions[0].correctAnswerIndex,
      undefined,
      'correctAnswerIndex must NEVER be exposed pre-submission'
    );

    // Failing submission must NOT verify skill
    const failSubmit = await request(port, 'POST', `/api/assessments/${pythonAss._id}/submit`, {
      cookie,
      body: { answers: { 'py-1': 0, 'py-2': 0, 'py-3': 0, 'py-4': 0, 'py-5': 0 } }
    });
    assert.equal(failSubmit.status, 200);
    assert.equal(failSubmit.body.data.passed, false);
    assert.equal(failSubmit.body.data.badgeAwarded, false);

    // Passing submission must award verified badge & persist in history
    const passSubmit = await request(port, 'POST', `/api/assessments/${pythonAss._id}/submit`, {
      cookie,
      body: { answers: { 'py-1': 2, 'py-2': 1, 'py-3': 1, 'py-4': 1, 'py-5': 1 } }
    });
    assert.equal(passSubmit.status, 200);
    assert.equal(passSubmit.body.data.passed, true);
    assert.equal(passSubmit.body.data.percentage, 100);
    assert.equal(passSubmit.body.data.badgeAwarded, true);
    assert.ok(passSubmit.body.data.verifiedSkillsAwarded.includes('Python'));

    const histRes = await request(port, 'GET', '/api/assessments/history', { cookie });
    assert.equal(histRes.status, 200);
    assert.equal(histRes.body.data.length, 2);
    console.log(
      `  ✓ Phase 2: ${ASSESSMENTS_CATALOG.length} assessments, hidden answer keys, scoring, badge rules & history verified`
    );

    // Phase 3: Learning Resources, URL validation & assignment submission
    const learnList = await request(port, 'GET', '/api/learning', { cookie });
    assert.equal(learnList.status, 200);
    assert.equal(learnList.body.data.length, LEARNING_CATALOG.length);

    const assignment = learnList.body.data.find((l: any) => l.type === 'practical_assignment');
    assert.ok(assignment);

    // Reject unsafe javascript: URL
    const badUrlRes = await request(port, 'PUT', `/api/learning/${assignment._id}/progress`, {
      cookie,
      body: { status: 'completed', submissionUrl: 'javascript:alert(1)' }
    });
    assert.equal(badUrlRes.status, 400);

    // Accept valid https:// submission & create portfolio deliverable
    const goodSubRes = await request(port, 'PUT', `/api/learning/${assignment._id}/progress`, {
      cookie,
      body: {
        status: 'completed',
        submissionUrl: 'https://github.com/kavya/python-cli-expense',
        submissionText: 'Implemented modular arithmetic and CSV expense summary.'
      }
    });
    assert.equal(goodSubRes.status, 200);
    assert.ok(goodSubRes.body.data.portfolioProject);
    console.log(
      `  ✓ Phase 3: ${LEARNING_CATALOG.length} learning resources, URL sanitization, progress persistence & portfolio link verified`
    );

    // Phase 4: Verified Government Schemes, eligibility guidance & save toggle
    const schemeList = await request(port, 'GET', '/api/schemes', { cookie });
    assert.equal(schemeList.status, 200);
    assert.equal(schemeList.body.data.length, GOVERNMENT_SCHEMES_CATALOG.length);
    for (const sc of schemeList.body.data) {
      assert.ok(sc.officialUrl.startsWith('https://'), 'Every scheme must have official HTTPS URL');
      assert.ok(sc.eligibilityStatus, 'Eligibility status must be present');
    }

    const firstSchemeId = schemeList.body.data[0]._id;
    const saveSchemeRes = await request(port, 'POST', `/api/schemes/${firstSchemeId}/save`, {
      cookie
    });
    assert.equal(saveSchemeRes.status, 200);
    assert.equal(saveSchemeRes.body.data.saved, true);
    console.log(
      `  ✓ Phase 4: ${GOVERNMENT_SCHEMES_CATALOG.length} verified schemes, smart eligibility & persisted bookmarking verified`
    );

    // Phase 5: Weighted Opportunities matching, academic cutoff rule & persisted Save Job
    const jobsRes = await request(port, 'GET', '/api/jobs/recommended', { cookie });
    assert.equal(jobsRes.status, 200);
    assert.equal(jobsRes.body.data.length, 1);
    const matchedJob = jobsRes.body.data[0];
    assert.ok(matchedJob.matchScore >= 70, `Expected high match score, got ${matchedJob.matchScore}`);
    assert.ok(
      matchedJob.matchReasons.some((r: string) => r.includes('minimum percentage (75%)')),
      'Should note employer academic cutoff when met'
    );
    assert.ok(matchedJob.missingSkills.includes('Excel'));

    const saveJobRes = await request(port, 'POST', `/api/jobs/${matchedJob._id}/save`, { cookie });
    assert.equal(saveJobRes.status, 200);
    assert.equal(saveJobRes.body.data.saved, true);

    const savedJobsRes = await request(port, 'GET', '/api/seeker/saved-opportunities', { cookie });
    assert.equal(savedJobsRes.status, 200);
    assert.equal(savedJobsRes.body.data.length, 1);
    console.log(
      '  ✓ Phase 5: Weighted opportunity matching, conditional academic score check, /api/jobs alias & persisted Save Job verified'
    );

    // Phase 6: Dynamic Connected Dashboard
    const dashRes = await request(port, 'GET', '/api/dashboard', { cookie });
    assert.equal(dashRes.status, 200);
    const d = dashRes.body.data;
    assert.ok(d.careerReadiness && typeof d.careerReadiness.score === 'number');
    assert.ok(d.recommendedOpportunities.length >= 1);
    assert.ok(d.recommendedSchemes.length >= 1);
    assert.ok(d.recommendedAssessments.length >= 1);
    assert.ok(d.recommendedLearning.length >= 1);
    assert.equal(d.savedOpportunitiesCount, 1);
    assert.equal(d.savedSchemesCount, 1);
    assert.equal(d.learningCompletedCount, 1);
    assert.equal(d.portfolioProjectsCount, 1);
    console.log('  ✓ Phase 6: Connected personalized Dashboard aggregates all 4 recommendation engines & live counts');

    console.log('\n✅ ALL 6 PHASES FULL-PLATFORM VERIFICATION TESTS PASSED!');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

run().catch((err) => {
  console.error('\n❌ Full-platform verification failed:', err);
  process.exit(1);
});
