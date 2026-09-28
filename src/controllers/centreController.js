const DiagnosticCentre = require('../models/mongo/DiagnosticCentre');
const DiagnosticTest = require('../models/mongo/DiagnosticTest');
const mongoose = require('mongoose');
const { getCache,setCache,deleteCache, } = require('../utils/cache');

// GET /api/tests - List all diagnostic tests
exports.listTests = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    // cache only the unfiltered lists. 
    if (!category && !search) {
      const cachedTests = await getCache('tests:all');

      if (cachedTests) {
        console.log('[Redis] HIT tests:all');

        return res.status(200).json({
          success: true,
          count: cachedTests.length,
          data: cachedTests,
          cached: true,
        });
      }

      console.log('[Redis] MISS tests:all');
    }


    const filter = {};

    if (category) filter.category = category.toUpperCase();
    if (search) filter.$text = { $search: search };

    const tests = await DiagnosticTest.find(filter).sort({ name: 1 });

    //cache only complete lists 
    if (!category && !search) {
      await setCache('tests:all', tests, 600);
      console.log('[Redis] SET tests:all TTL=600');
    }

    res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tests - Create a diagnostic test
exports.createTest = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    const test = await DiagnosticTest.create({ name, description, category });

    await deleteCache('tests:all');
    console.log('[Redis] INVALIDATE tests:all');

    res.status(201).json({
      success: true,
      message: 'Diagnostic test created successfully.',
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/centres - List all diagnostic centres
exports.listCentres = async (req, res, next) => {
  try {
    const { city, search } = req.query;

    // Cache only the complete centre list.
    if (!city && !search) {
      const cachedCentres = await getCache('centres:all');

      if (cachedCentres) {
        console.log('[Redis] HIT centres:all');

        return res.status(200).json({
          success: true,
          count: cachedCentres.length,
          data: cachedCentres,
          cached: true,
        });
      }

      console.log('[Redis] MISS centres:all');
    }

    const filter = {};

    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (search) filter.$text = { $search: search };

    const centres = await DiagnosticCentre.find(filter)
      .populate('tests.test')
      .sort({ name: 1 })
      .lean();

    if (!city && !search) {
      await setCache('centres:all', centres, 300);

      console.log('[Redis] SET centres:all TTL=300');
    }

    res.status(200).json({
      success: true,
      count: centres.length,
      data: centres,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/centres/:id - Get centre details
exports.getCentre = async (req, res, next) => {
  try {
    const centreId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(centreId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid centre ID format.',
      });
    }

    const cacheKey = `centre:${centreId}`;

    const cachedCentre = await getCache(cacheKey);

    if (cachedCentre) {
      console.log(`[Redis] HIT ${cacheKey}`);

      return res.status(200).json({
        success: true,
        data: cachedCentre,
        cached: true,
      });
    }

    console.log(`[Redis] MISS ${cacheKey}`);

    const centre = await DiagnosticCentre.findById(centreId)
      .populate('tests.test')
      .lean();

    if (!centre) {
      return res.status(404).json({
        success: false,
        message: 'Diagnostic centre not found.',
      });
    }

    await setCache(cacheKey, centre, 300);

    console.log(`[Redis] SET ${cacheKey} TTL=300`);

    res.status(200).json({
      success: true,
      data: centre,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/centres - Create a diagnostic centre
exports.createCentre = async (req, res, next) => {
  try {
    const { name, location } = req.body;
    const centre = await DiagnosticCentre.create({ name, location, tests: [] });

    await deleteCache('centres:all');
    console.log('[Redis] INVALIDATE centres:all');

    res.status(201).json({
      success: true,
      message: 'Diagnostic centre created successfully.',
      data: centre,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/centres/:id/tests - Add a test to a centre with a price
exports.addTestToCentre = async (req, res, next) => {
  try {
    const { test_id, price } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid centre ID format.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(test_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test ID format.',
      });
    }

    // Verify test exists
    const test = await DiagnosticTest.findById(test_id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Diagnostic test not found.',
      });
    }

    const centre = await DiagnosticCentre.findById(req.params.id);
    if (!centre) {
      return res.status(404).json({
        success: false,
        message: 'Diagnostic centre not found.',
      });
    }

    // Check if test is already added to this centre
    const existingTest = centre.tests.find(
      (t) => t.test.toString() === test_id
    );
    if (existingTest) {
      return res.status(409).json({
        success: false,
        message: 'This test is already available at this centre.',
      });
    }

    centre.tests.push({ test: test_id, price });
    await centre.save();

    await centre.save();

    // Centre data and centre list have changed.
    await deleteCache('centres:all');
    await deleteCache(`centre:${req.params.id}`);

    console.log('[Redis] INVALIDATE centres:all');
    console.log(`[Redis] INVALIDATE centre:${req.params.id}`);

    const updatedCentre = await DiagnosticCentre.findById(req.params.id)
      .populate('tests.test');

    res.status(200).json({
      success: true,
      message: 'Test added to centre successfully.',
      data: updatedCentre,
    });
  } catch (error) {
    next(error);
  }
};
