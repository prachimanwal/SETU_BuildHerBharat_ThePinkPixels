"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuildHerResources = exports.getPublicSchemes = exports.getOpportunityById = exports.getPublicOpportunities = void 0;
const Opportunity_1 = require("../models/Opportunity");
const User_1 = require("../models/User");
const GovernmentScheme_1 = require("../models/GovernmentScheme");
const LearningResource_1 = require("../models/LearningResource");
const getPublicOpportunities = async (req, res) => {
    try {
        const { query, location, workMode, opportunityType, isCareerRestart, page = '1', limit = '20' } = req.query;
        // Find all approved employers
        const approvedEmployers = await User_1.User.find({
            role: 'employer',
            'employerProfile.verificationStatus': 'approved'
        }).select('_id employerProfile.verificationStatus');
        const approvedEmployerIds = approvedEmployers.map((e) => e._id);
        // Filter only published opportunities from approved employers
        const filter = {
            status: 'published',
            employerId: { $in: approvedEmployerIds }
        };
        if (workMode && workMode !== 'all') {
            filter.workMode = workMode;
        }
        if (opportunityType && opportunityType !== 'all') {
            filter.opportunityType = opportunityType;
        }
        if (isCareerRestart === 'true' || String(isCareerRestart) === 'true') {
            filter.isCareerRestart = true;
        }
        if (location && typeof location === 'string' && location.trim() !== '') {
            filter.location = { $regex: location.trim(), $options: 'i' };
        }
        if (query && typeof query === 'string' && query.trim() !== '') {
            const q = query.trim();
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { organisationName: { $regex: q, $options: 'i' } },
                { requiredSkills: { $regex: q, $options: 'i' } }
            ];
        }
        const opportunities = await Opportunity_1.Opportunity.find(filter)
            .populate('employerId', 'name employerProfile.companyName employerProfile.verificationStatus')
            .lean();
        // Seeker profile for transparent ranking and explainability
        const seeker = req.user?.role === 'seeker' ? req.user.seekerProfile : null;
        const seekerSkills = seeker?.skills?.map((s) => s.toLowerCase().trim()) || [];
        const seekerPreferredMode = seeker?.preferredWorkMode;
        const isSeekerRestart = seeker?.isCareerRestart;
        const seekerLocation = seeker?.location?.city || seeker?.location?.state || '';
        const scoredResults = opportunities.map((opp) => {
            let score = 50; // baseline
            const matchReasons = [];
            // 1. Skill Match
            if (seekerSkills.length > 0 && opp.requiredSkills && opp.requiredSkills.length > 0) {
                const oppSkills = opp.requiredSkills.map((s) => s.toLowerCase().trim());
                const matchingSkills = opp.requiredSkills.filter((s) => seekerSkills.includes(s.toLowerCase().trim()));
                if (matchingSkills.length > 0) {
                    const matchRatio = matchingSkills.length / oppSkills.length;
                    score += Math.round(matchRatio * 35);
                    matchReasons.push(`Matches your skills: ${matchingSkills.join(', ')}`);
                }
            }
            // 2. Work Mode Match
            if (seekerPreferredMode && seekerPreferredMode !== 'any') {
                if (opp.workMode === seekerPreferredMode) {
                    score += 15;
                    matchReasons.push(opp.workMode === 'remote'
                        ? 'Remote work fits your preference'
                        : `${opp.workMode.toUpperCase()} mode fits your preference`);
                }
            }
            else if (opp.workMode === 'remote') {
                matchReasons.push('100% Remote flexibility');
            }
            // 3. Career Restart Match
            if (opp.isCareerRestart) {
                if (isSeekerRestart) {
                    score += 20;
                    matchReasons.push('Specifically designed for women returning to work');
                }
                else {
                    matchReasons.push('Career restart & transition friendly');
                }
            }
            // 4. Location Match
            if (seekerLocation && opp.location) {
                if (opp.location.toLowerCase().includes(seekerLocation.toLowerCase())) {
                    score += 10;
                    matchReasons.push(`Located near you in ${opp.location}`);
                }
            }
            // 5. Fresher / Practical skills friendliness
            if (opp.experienceRequired &&
                (opp.experienceRequired.toLowerCase().includes('fresher') ||
                    opp.experienceRequired.toLowerCase().includes('none'))) {
                matchReasons.push('Fresher & practical-skills friendly (No rigid degree required)');
            }
            if (matchReasons.length === 0) {
                matchReasons.push('Open credible opportunity on SETU');
            }
            return {
                opportunity: opp,
                matchScore: Math.min(100, score),
                matchReasons
            };
        });
        // Sort descending by matchScore, then by newest
        scoredResults.sort((a, b) => b.matchScore - a.matchScore);
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const paginated = scoredResults.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        res.json({
            total: scoredResults.length,
            page: pageNum,
            limit: limitNum,
            results: paginated
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to search opportunities' });
    }
};
exports.getPublicOpportunities = getPublicOpportunities;
const getOpportunityById = async (req, res) => {
    try {
        const opp = await Opportunity_1.Opportunity.findById(req.params.id).populate('employerId', 'name employerProfile.companyName employerProfile.industry employerProfile.verificationStatus');
        if (!opp) {
            res.status(404).json({ error: 'Opportunity not found' });
            return;
        }
        res.json(opp);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch opportunity' });
    }
};
exports.getOpportunityById = getOpportunityById;
// --- Government Schemes Directory ---
const getPublicSchemes = async (req, res) => {
    try {
        const { query, category, audience } = req.query;
        const filter = { isActive: true };
        if (category && category !== 'all') {
            filter.category = category;
        }
        if (audience && audience !== 'all') {
            filter.targetAudience = audience;
        }
        if (query && typeof query === 'string' && query.trim() !== '') {
            const q = query.trim();
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { hindiTitle: { $regex: q, $options: 'i' } },
                { ministryOrDepartment: { $regex: q, $options: 'i' } },
                { benefitsSummary: { $regex: q, $options: 'i' } },
                { eligibilitySummary: { $regex: q, $options: 'i' } }
            ];
        }
        const schemes = await GovernmentScheme_1.GovernmentScheme.find(filter).sort({ createdAt: -1 });
        res.json(schemes);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch government schemes' });
    }
};
exports.getPublicSchemes = getPublicSchemes;
// --- Build Her Resources ---
const getBuildHerResources = async (_req, res) => {
    try {
        // 1. Career restart opportunities
        const restartOpportunities = await Opportunity_1.Opportunity.find({
            status: 'published',
            isCareerRestart: true
        })
            .populate('employerId', 'name employerProfile.companyName')
            .limit(6);
        // 2. Refreshers & skill modules
        const refreshers = await LearningResource_1.LearningResource.find({
            $or: [{ domain: 'build_her_refresher' }, { type: 'refresher' }]
        }).limit(6);
        // 3. Women-centric schemes
        const womenSchemes = await GovernmentScheme_1.GovernmentScheme.find({
            isActive: true,
            $or: [{ targetAudience: 'women' }, { category: 'women_empowerment' }]
        }).limit(6);
        res.json({
            restartOpportunities,
            refreshers,
            womenSchemes,
            safetyGuidelines: {
                title: 'POSH Act & Workplace Safety Rights',
                helplines: [
                    { label: 'National Commission for Women Helpline', number: '7827170170' },
                    { label: 'Women in Distress Emergency', number: '1091' },
                    { label: 'National Emergency Helpline', number: '112' },
                    { label: 'Domestic Abuse Helpline', number: '181' }
                ],
                keyRights: [
                    'Right to a workplace free from harassment under the POSH Act 2013',
                    'Mandatory Internal Complaints Committee (ICC) in workplaces with 10+ employees',
                    'Protection against retaliatory action for reporting misconduct',
                    'Maternity Benefits Act provisions and flexible work arrangements',
                    'Equal Remuneration Act guarantee for equal pay for equal work'
                ]
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to load Build Her resources' });
    }
};
exports.getBuildHerResources = getBuildHerResources;
