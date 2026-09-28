require('dotenv').config();

const mongoose = require('mongoose');
const { sequelize, User } = require('../src/models/pg');
const connectMongoDB = require('../src/config/mongodb');
const DiagnosticTest = require('../src/models/mongo/DiagnosticTest');
const DiagnosticCentre = require('../src/models/mongo/DiagnosticCentre');

const seedData = async () => {
  try {
    // Connect databases
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('PostgreSQL connected and tables recreated');

    await connectMongoDB();
    console.log('MongoDB connected');

    // Clear existing data
    await DiagnosticTest.deleteMany({});
    await DiagnosticCentre.deleteMany({});
    console.log('Existing MongoDB data cleared');

    // Create demo user
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '+91-9876543210',
    });
    console.log('Demo user created:', user.email);

    // Create diagnostic tests
    const tests = await DiagnosticTest.insertMany([
      { name: 'Complete Blood Count (CBC)', description: 'Measures different components of blood including red and white blood cells, hemoglobin, and platelets.', category: 'BLOOD' },
      { name: 'Lipid Profile', description: 'Measures cholesterol levels including HDL, LDL, and triglycerides.', category: 'BLOOD' },
      { name: 'Thyroid Function Test (TFT)', description: 'Measures thyroid hormones TSH, T3, and T4.', category: 'BLOOD' },
      { name: 'Urinalysis', description: 'Examines urine for various disorders including kidney disease and diabetes.', category: 'URINE' },
      { name: 'Chest X-Ray', description: 'Imaging test to view the lungs, heart, and chest wall.', category: 'IMAGING' },
      { name: 'ECG (Electrocardiogram)', description: 'Records electrical signals in the heart to check for heart conditions.', category: 'CARDIAC' },
      { name: 'MRI Brain', description: 'Magnetic resonance imaging of the brain for detailed visualization.', category: 'RADIOLOGY' },
      { name: 'Liver Function Test (LFT)', description: 'Measures proteins, liver enzymes, and bilirubin in blood.', category: 'BLOOD' },
    ]);
    console.log(`${tests.length} diagnostic tests created`);

    // Create diagnostic centres
    const centres = await DiagnosticCentre.insertMany([
      {
        name: 'HealthFirst Diagnostics',
        location: { address: '123 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        tests: [
          { test: tests[0]._id, price: 500 },
          { test: tests[1]._id, price: 800 },
          { test: tests[2]._id, price: 1200 },
          { test: tests[4]._id, price: 600 },
          { test: tests[5]._id, price: 400 },
        ],
      },
      {
        name: 'MedScan Labs',
        location: { address: '456 Connaught Place', city: 'Delhi', state: 'Delhi', pincode: '110001' },
        tests: [
          { test: tests[0]._id, price: 450 },
          { test: tests[1]._id, price: 750 },
          { test: tests[3]._id, price: 300 },
          { test: tests[6]._id, price: 8000 },
          { test: tests[7]._id, price: 900 },
        ],
      },
      {
        name: 'City Diagnostics Centre',
        location: { address: '789 Brigade Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
        tests: [
          { test: tests[0]._id, price: 550 },
          { test: tests[2]._id, price: 1100 },
          { test: tests[4]._id, price: 700 },
          { test: tests[5]._id, price: 450 },
          { test: tests[6]._id, price: 7500 },
          { test: tests[7]._id, price: 850 },
        ],
      },
    ]);
    console.log(`${centres.length} diagnostic centres created`);

    console.log('\n--- Seed Summary ---');
    console.log('Demo User: john@example.com / password123');
    console.log(`Tests: ${tests.length}`);
    console.log(`Centres: ${centres.length}`);
    console.log('Seed completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedData();
