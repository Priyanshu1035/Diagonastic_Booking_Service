const express = require('express');
const { body } = require('express-validator');
const centreController = require('../controllers/centreController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// --- Diagnostic Tests ---

// GET /api/tests
router.get('/tests', authenticate, centreController.listTests);

// POST /api/tests
router.post(
  '/tests',
  authenticate,
  validate([
    body('name').trim().notEmpty().withMessage('Test name is required'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isIn(['BLOOD', 'URINE', 'IMAGING', 'CARDIAC', 'PATHOLOGY', 'RADIOLOGY', 'OTHER'])
      .withMessage('Category must be one of: BLOOD, URINE, IMAGING, CARDIAC, PATHOLOGY, RADIOLOGY, OTHER'),
    body('description').optional().trim(),
  ]),
  centreController.createTest
);

// --- Diagnostic Centres ---

// GET /api/centres
router.get('/', authenticate, centreController.listCentres);

// GET /api/centres/:id
router.get('/:id', authenticate, centreController.getCentre);

// POST /api/centres
router.post(
  '/',
  authenticate,
  validate([
    body('name').trim().notEmpty().withMessage('Centre name is required'),
    body('location.address').trim().notEmpty().withMessage('Address is required'),
    body('location.city').trim().notEmpty().withMessage('City is required'),
    body('location.state').trim().notEmpty().withMessage('State is required'),
    body('location.pincode').trim().notEmpty().withMessage('Pincode is required'),
  ]),
  centreController.createCentre
);

// POST /api/centres/:id/tests
router.post(
  '/:id/tests',
  authenticate,
  validate([
    body('test_id').notEmpty().withMessage('Test ID is required'),
    body('price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  ]),
  centreController.addTestToCentre
);

module.exports = router;
