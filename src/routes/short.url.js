import express from "express";
import shortUrlController from "../controllers/short.url.controller.js";
import { validate } from '../middleware/validate.js';
import {GenerateUrlSchema} from '../schemas/generateUrl.schema.js'

const router = express.Router();

router.post('/generate', validate(GenerateUrlSchema),  shortUrlController.generateUrl);
router.get('/:shortUrl', shortUrlController.redirectUrl);
router.get('/analytics/:shortUrl', shortUrlController.urlAnalytics);
router.get('/', shortUrlController.allUrls);

export default router;