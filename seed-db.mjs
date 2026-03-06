import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function seed() {
  console.log('🌱 Starting database seed...');
  
  let connection;
  try {
    // Parse DATABASE_URL to get connection details
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {},
      enableKeepAlive: true,
    };

    console.log(`📡 Connecting to database at ${config.host}:${config.port}/${config.database}...`);
    
    const poolConnection = await mysql.createConnection(config);
    const db = drizzle(poolConnection);

    // Create owner/landlord user
    console.log('👤 Creating owner user...');
    const ownerResult = await db.insert(schema.users).values({
      openId: 'owner-001',
      name: 'Siyabonga Nkala',
      email: 'siyabonga@rentala.co.za',
      phone: '+27123456789',
      role: 'landlord',
      status: 'active',
      loginMethod: 'oauth',
      lastSignedIn: new Date(),
    });
    console.log('✅ Owner user created');

    // Create agency
    console.log('🏢 Creating agency...');
    const agencyResult = await db.insert(schema.agencies).values({
      name: 'Rentala Properties',
      description: 'Professional property management company',
      contactEmail: 'info@rentala.co.za',
      contactPhone: '+27123456789',
      address: '123 Main Street',
      city: 'Johannesburg',
      country: 'South Africa',
      website: 'https://rentala.co.za',
      status: 'active',
    });
    console.log('✅ Agency created');

    // Create properties
    console.log('🏠 Creating properties...');
    const propertiesData = [
      {
        agencyId: 1,
        ownerId: 1,
        name: 'Sunset Apartments',
        address: '456 Sunset Boulevard',
        city: 'Johannesburg',
        province: 'Gauteng',
        country: 'South Africa',
        postalCode: '2000',
        propertyType: 'residential',
        status: 'active',
        totalUnits: 12,
        description: 'Modern apartment complex with 12 units, secure parking, and 24/7 security',
      },
      {
        agencyId: 1,
        ownerId: 1,
        name: 'Downtown Complex',
        address: '789 Main Street',
        city: 'Johannesburg',
        province: 'Gauteng',
        country: 'South Africa',
        postalCode: '2001',
        propertyType: 'commercial',
        status: 'active',
        totalUnits: 8,
        description: 'Commercial office complex with modern amenities',
      },
      {
        agencyId: 1,
        ownerId: 1,
        name: 'Garden Heights',
        address: '321 Garden Road',
        city: 'Johannesburg',
        province: 'Gauteng',
        country: 'South Africa',
        postalCode: '2002',
        propertyType: 'residential',
        status: 'active',
        totalUnits: 25,
        description: 'Residential complex with 25 units, gardens, and community facilities',
      },
    ];

    for (const prop of propertiesData) {
      await db.insert(schema.properties).values(prop);
    }
    console.log('✅ Properties created (3 total)');

    // Create units
    console.log('🚪 Creating units...');
    const unitsData = [
      // Sunset Apartments units
      { propertyId: 1, unitNumber: '101', unitType: 'one_bedroom', bedrooms: 1, bathrooms: 1, squareFeet: 450, rentAmount: '8500.00', deposit: '8500.00', status: 'occupied', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '102', unitType: 'two_bedroom', bedrooms: 2, bathrooms: 1, squareFeet: 650, rentAmount: '12000.00', deposit: '12000.00', status: 'occupied', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '103', unitType: 'one_bedroom', bedrooms: 1, bathrooms: 1, squareFeet: 450, rentAmount: '8500.00', deposit: '8500.00', status: 'vacant', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '104', unitType: 'studio', bedrooms: 0, bathrooms: 1, squareFeet: 300, rentAmount: '6500.00', deposit: '6500.00', status: 'occupied', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '201', unitType: 'two_bedroom', bedrooms: 2, bathrooms: 2, squareFeet: 700, rentAmount: '14000.00', deposit: '14000.00', status: 'occupied', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '202', unitType: 'one_bedroom', bedrooms: 1, bathrooms: 1, squareFeet: 450, rentAmount: '8500.00', deposit: '8500.00', status: 'occupied', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '203', unitType: 'three_bedroom', bedrooms: 3, bathrooms: 2, squareFeet: 900, rentAmount: '18000.00', deposit: '18000.00', status: 'occupied', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '204', unitType: 'studio', bedrooms: 0, bathrooms: 1, squareFeet: 300, rentAmount: '6500.00', deposit: '6500.00', status: 'vacant', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '301', unitType: 'two_bedroom', bedrooms: 2, bathrooms: 1, squareFeet: 650, rentAmount: '12000.00', deposit: '12000.00', status: 'occupied', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '302', unitType: 'one_bedroom', bedrooms: 1, bathrooms: 1, squareFeet: 450, rentAmount: '8500.00', deposit: '8500.00', status: 'maintenance', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '303', unitType: 'studio', bedrooms: 0, bathrooms: 1, squareFeet: 300, rentAmount: '6500.00', deposit: '6500.00', status: 'occupied', currency: 'ZAR' },
      { propertyId: 1, unitNumber: '304', unitType: 'two_bedroom', bedrooms: 2, bathrooms: 2, squareFeet: 700, rentAmount: '14000.00', deposit: '14000.00', status: 'occupied', currency: 'ZAR' },
    ];

    for (const unit of unitsData) {
      await db.insert(schema.units).values(unit);
    }
    console.log('✅ Units created (12 total)');

    // Create tenants
    console.log('👥 Creating tenants...');
    const tenantsData = [
      { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '+27712345678', idNumber: '9001011234567', idType: 'national_id', employmentStatus: 'employed', employer: 'Tech Corp', monthlyIncome: '35000.00', status: 'active' },
      { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '+27712345679', idNumber: '9101011234567', idType: 'national_id', employmentStatus: 'employed', employer: 'Finance Inc', monthlyIncome: '42000.00', status: 'active' },
      { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@example.com', phone: '+27712345680', idNumber: '9201011234567', idType: 'national_id', employmentStatus: 'self_employed', monthlyIncome: '28000.00', status: 'active' },
      { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@example.com', phone: '+27712345681', idNumber: '9301011234567', idType: 'national_id', employmentStatus: 'employed', employer: 'Retail Co', monthlyIncome: '22000.00', status: 'active' },
      { firstName: 'David', lastName: 'Brown', email: 'david.brown@example.com', phone: '+27712345682', idNumber: '9401011234567', idType: 'national_id', employmentStatus: 'employed', employer: 'Manufacturing Ltd', monthlyIncome: '32000.00', status: 'active' },
      { firstName: 'Emma', lastName: 'Davis', email: 'emma.davis@example.com', phone: '+27712345683', idNumber: '9501011234567', idType: 'national_id', employmentStatus: 'employed', employer: 'Healthcare Plus', monthlyIncome: '38000.00', status: 'active' },
      { firstName: 'James', lastName: 'Miller', email: 'james.miller@example.com', phone: '+27712345684', idNumber: '9601011234567', idType: 'national_id', employmentStatus: 'employed', employer: 'Education Services', monthlyIncome: '25000.00', status: 'active' },
      { firstName: 'Lisa', lastName: 'Wilson', email: 'lisa.wilson@example.com', phone: '+27712345685', idNumber: '9701011234567', idType: 'national_id', employmentStatus: 'employed', employer: 'Marketing Agency', monthlyIncome: '30000.00', status: 'active' },
    ];

    for (const tenant of tenantsData) {
      await db.insert(schema.tenants).values(tenant);
    }
    console.log('✅ Tenants created (8 total)');

    // Create leases
    console.log('📋 Creating leases...');
    const leasesData = [
      { unitId: 1, tenantId: 1, propertyId: 1, startDate: new Date('2023-01-15'), endDate: new Date('2025-01-14'), rentAmount: '8500.00', deposit: '8500.00', depositPaid: true, paymentDueDay: 1, status: 'active', currency: 'ZAR' },
      { unitId: 2, tenantId: 2, propertyId: 1, startDate: new Date('2023-03-01'), endDate: new Date('2025-02-28'), rentAmount: '12000.00', deposit: '12000.00', depositPaid: true, paymentDueDay: 1, status: 'active', currency: 'ZAR' },
      { unitId: 4, tenantId: 3, propertyId: 1, startDate: new Date('2023-06-15'), endDate: new Date('2025-06-14'), rentAmount: '6500.00', deposit: '6500.00', depositPaid: true, paymentDueDay: 1, status: 'active', currency: 'ZAR' },
      { unitId: 5, tenantId: 4, propertyId: 1, startDate: new Date('2023-02-01'), endDate: new Date('2025-01-31'), rentAmount: '14000.00', deposit: '14000.00', depositPaid: true, paymentDueDay: 1, status: 'active', currency: 'ZAR' },
      { unitId: 6, tenantId: 5, propertyId: 1, startDate: new Date('2023-04-15'), endDate: new Date('2025-04-14'), rentAmount: '8500.00', deposit: '8500.00', depositPaid: true, paymentDueDay: 1, status: 'active', currency: 'ZAR' },
      { unitId: 7, tenantId: 6, propertyId: 1, startDate: new Date('2023-05-01'), endDate: new Date('2025-04-30'), rentAmount: '18000.00', deposit: '18000.00', depositPaid: true, paymentDueDay: 1, status: 'active', currency: 'ZAR' },
      { unitId: 9, tenantId: 7, propertyId: 1, startDate: new Date('2023-07-15'), endDate: new Date('2025-07-14'), rentAmount: '12000.00', deposit: '12000.00', depositPaid: true, paymentDueDay: 1, status: 'active', currency: 'ZAR' },
      { unitId: 11, tenantId: 8, propertyId: 1, startDate: new Date('2023-08-01'), endDate: new Date('2025-07-31'), rentAmount: '6500.00', deposit: '6500.00', depositPaid: true, paymentDueDay: 1, status: 'active', currency: 'ZAR' },
    ];

    for (const lease of leasesData) {
      await db.insert(schema.leases).values(lease);
    }
    console.log('✅ Leases created (8 total)');

    // Create payments
    console.log('💳 Creating payments...');
    const paymentsData = [
      { leaseId: 1, unitId: 1, tenantId: 1, amount: '8500.00', dueDate: new Date('2026-03-01'), paidDate: new Date('2026-02-28'), status: 'paid', paymentMethod: 'bank_transfer', reference: 'TXN001', currency: 'ZAR' },
      { leaseId: 2, unitId: 2, tenantId: 2, amount: '12000.00', dueDate: new Date('2026-03-01'), paidDate: null, status: 'overdue', paymentMethod: 'bank_transfer', reference: 'TXN002', currency: 'ZAR' },
      { leaseId: 3, unitId: 4, tenantId: 3, amount: '6500.00', dueDate: new Date('2026-03-01'), paidDate: new Date('2026-03-02'), status: 'paid', paymentMethod: 'bank_transfer', reference: 'TXN003', currency: 'ZAR' },
      { leaseId: 4, unitId: 5, tenantId: 4, amount: '14000.00', dueDate: new Date('2026-03-01'), paidDate: null, status: 'pending', paymentMethod: 'bank_transfer', reference: 'TXN004', currency: 'ZAR' },
      { leaseId: 5, unitId: 6, tenantId: 5, amount: '8500.00', dueDate: new Date('2026-03-01'), paidDate: new Date('2026-02-27'), status: 'paid', paymentMethod: 'bank_transfer', reference: 'TXN005', currency: 'ZAR' },
      { leaseId: 6, unitId: 7, tenantId: 6, amount: '18000.00', dueDate: new Date('2026-03-01'), paidDate: null, status: 'pending', paymentMethod: 'bank_transfer', reference: 'TXN006', currency: 'ZAR' },
      { leaseId: 7, unitId: 9, tenantId: 7, amount: '12000.00', dueDate: new Date('2026-03-01'), paidDate: new Date('2026-03-01'), status: 'paid', paymentMethod: 'bank_transfer', reference: 'TXN007', currency: 'ZAR' },
      { leaseId: 8, unitId: 11, tenantId: 8, amount: '6500.00', dueDate: new Date('2026-03-01'), paidDate: null, status: 'overdue', paymentMethod: 'bank_transfer', reference: 'TXN008', currency: 'ZAR' },
    ];

    for (const payment of paymentsData) {
      await db.insert(schema.payments).values(payment);
    }
    console.log('✅ Payments created (8 total)');

    // Create maintenance requests
    console.log('🔧 Creating maintenance requests...');
    const maintenanceData = [
      { propertyId: 1, unitId: 1, tenantId: 1, title: 'Leaking tap in kitchen', description: 'Water is dripping from the kitchen tap at approximately 1 drop per second', priority: 'high', status: 'open', category: 'plumbing' },
      { propertyId: 1, unitId: 2, tenantId: 2, title: 'Air conditioner not working', description: 'AC unit is not cooling properly, temperature not dropping below 28°C', priority: 'high', status: 'in_progress', category: 'appliances' },
      { propertyId: 1, unitId: 5, tenantId: 4, title: 'Door lock repair', description: 'Front door lock is stuck, difficult to open and close', priority: 'medium', status: 'open', category: 'other' },
    ];

    for (const maintenance of maintenanceData) {
      await db.insert(schema.maintenanceRequests).values(maintenance);
    }
    console.log('✅ Maintenance requests created (3 total)');

    console.log('\n✨ Database seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✓ 1 Owner/Landlord user');
    console.log('  ✓ 1 Agency');
    console.log('  ✓ 3 Properties');
    console.log('  ✓ 12 Units (10 occupied, 1 vacant, 1 maintenance)');
    console.log('  ✓ 8 Tenants');
    console.log('  ✓ 8 Leases (all active)');
    console.log('  ✓ 8 Payments (5 paid, 2 pending, 1 overdue)');
    console.log('  ✓ 3 Maintenance Requests');
    
    await poolConnection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
