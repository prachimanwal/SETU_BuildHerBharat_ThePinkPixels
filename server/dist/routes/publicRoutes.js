"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const publicController_1 = require("../controllers/publicController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Uses optionalAuth so if a seeker is logged in, their skills/preferences are used for explainable ranking!
router.get('/opportunities', auth_1.optionalAuth, publicController_1.getPublicOpportunities);
router.get('/opportunities/:id', auth_1.optionalAuth, publicController_1.getOpportunityById);
router.get('/schemes', publicController_1.getPublicSchemes);
router.get('/build-her', publicController_1.getBuildHerResources);
exports.default = router;
