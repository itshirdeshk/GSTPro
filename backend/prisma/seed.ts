// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Seeding database...\n');

//   // Clean existing data
//   await prisma.auditLog.deleteMany();
//   await prisma.payment.deleteMany();
//   await prisma.invoiceItem.deleteMany();
//   await prisma.invoice.deleteMany();
//   await prisma.expense.deleteMany();
//   await prisma.product.deleteMany();
//   await prisma.customer.deleteMany();
//   await prisma.subscription.deleteMany();
//   await prisma.user.deleteMany();
//   await prisma.tenant.deleteMany();

//   console.log('✓ Cleaned existing data\n');

//   // ============================================
//   // 1. Create Tenant
//   // ============================================
//   const tenant = await prisma.tenant.create({
//     data: {
//       businessName: 'TechSoft Solutions Pvt Ltd',
//       gstin: '27AABCT1234F1ZH',
//       pan: 'AABCT1234F',
//       businessType: 'Private Limited',
//       address: '42, Senapati Bapat Marg, Lower Parel',
//       city: 'Mumbai',
//       state: 'Maharashtra',
//       stateCode: '27',
//       pincode: '400013',
//       phone: '9876543210',
//       email: 'admin@techsoft.in',
//       website: 'https://techsoft.in',
//       invoicePrefix: 'TS',
//       lastInvoiceNumber: 0,
//       isComposition: false,
//       bankDetails: {
//         bankName: 'HDFC Bank',
//         accountNumber: '50100123456789',
//         ifsc: 'HDFC0001234',
//         branchName: 'Lower Parel Branch',
//       },
//     },
//   });
//   console.log(`✓ Tenant created: ${tenant.businessName}`);

//   // ============================================
//   // 2. Create Users
//   // ============================================
//   const hashedPassword = await bcrypt.hash('Admin@123', 12);

//   const admin = await prisma.user.create({
//     data: {
//       tenantId: tenant.id,
//       name: 'Rajesh Kumar',
//       email: 'admin@techsoft.in',
//       password: hashedPassword,
//       role: 'ADMIN',
//       phone: '9876543210',
//     },
//   });

//   const staff = await prisma.user.create({
//     data: {
//       tenantId: tenant.id,
//       name: 'Priya Sharma',
//       email: 'staff@techsoft.in',
//       password: hashedPassword,
//       role: 'STAFF',
//       phone: '9876543211',
//     },
//   });

//   const accountant = await prisma.user.create({
//     data: {
//       tenantId: tenant.id,
//       name: 'Amit Patel',
//       email: 'accountant@techsoft.in',
//       password: hashedPassword,
//       role: 'ACCOUNTANT',
//       phone: '9876543212',
//     },
//   });
//   console.log(`✓ Users created: Admin, Staff, Accountant`);

//   // ============================================
//   // 3. Create Subscription
//   // ============================================
//   const subscription = await prisma.subscription.create({
//     data: {
//       tenantId: tenant.id,
//       plan: 'PRO',
//       status: 'ACTIVE',
//       maxInvoicesPerMonth: 999,
//       maxCustomers: 999,
//       maxUsers: 10,
//       startDate: new Date(),
//       endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
//     },
//   });
//   console.log(`✓ Subscription created: PRO plan`);

//   // ============================================
//   // 4. Create Customers
//   // ============================================
//   const customers = await Promise.all([
//     prisma.customer.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'InfoTech Services Ltd',
//         gstin: '27AABCI5678G1ZP',
//         email: 'billing@infotech.co.in',
//         phone: '9988776655',
//         address: '15, Andheri East',
//         city: 'Mumbai',
//         state: 'Maharashtra',
//         stateCode: '27',
//         pincode: '400069',
//         outstandingAmount: 0,
//       },
//     }),
//     prisma.customer.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'DigiWave Technologies',
//         gstin: '29AADCD1234H1ZP',
//         email: 'accounts@digiwave.in',
//         phone: '9887766554',
//         address: '88, Koramangala',
//         city: 'Bangalore',
//         state: 'Karnataka',
//         stateCode: '29',
//         pincode: '560034',
//         outstandingAmount: 0,
//       },
//     }),
//     prisma.customer.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'CloudNine Solutions',
//         gstin: '27AAECC5678J1ZM',
//         email: 'finance@cloudnine.co.in',
//         phone: '9776655443',
//         address: '22, Bandra West',
//         city: 'Mumbai',
//         state: 'Maharashtra',
//         stateCode: '27',
//         pincode: '400050',
//         outstandingAmount: 0,
//       },
//     }),
//     prisma.customer.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'RapidBuild Enterprises',
//         gstin: '06AABCR9012K1ZH',
//         email: 'invoices@rapidbuild.in',
//         phone: '9665544332',
//         address: '5, Sector 44',
//         city: 'Gurgaon',
//         state: 'Haryana',
//         stateCode: '06',
//         pincode: '122003',
//         outstandingAmount: 0,
//       },
//     }),
//     prisma.customer.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'SmartRetail India Pvt Ltd',
//         gstin: '33AABCS3456L1ZK',
//         email: 'accounts@smartretail.in',
//         phone: '9554433221',
//         address: '16, T Nagar',
//         city: 'Chennai',
//         state: 'Tamil Nadu',
//         stateCode: '33',
//         pincode: '600017',
//         outstandingAmount: 0,
//       },
//     }),
//   ]);
//   console.log(`✓ Customers created: ${customers.length}`);

//   // ============================================
//   // 5. Create Products
//   // ============================================
//   const products = await Promise.all([
//     prisma.product.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'Web Development Service',
//         description: 'Full-stack web application development',
//         type: 'SERVICE',
//         hsnCode: '998314',
//         sacCode: '998314',
//         gstRate: 18,
//         sellingPrice: 50000,
//         unit: 'project',
//       },
//     }),
//     prisma.product.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'Mobile App Development',
//         description: 'Native/cross-platform mobile app development',
//         type: 'SERVICE',
//         hsnCode: '998314',
//         sacCode: '998314',
//         gstRate: 18,
//         sellingPrice: 75000,
//         unit: 'project',
//       },
//     }),
//     prisma.product.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'Cloud Hosting (Annual)',
//         description: 'Managed cloud hosting with 99.9% uptime',
//         type: 'SERVICE',
//         hsnCode: '998315',
//         sacCode: '998315',
//         gstRate: 18,
//         sellingPrice: 24000,
//         unit: 'year',
//       },
//     }),
//     prisma.product.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'IT Consulting (Hourly)',
//         description: 'Expert IT consulting services',
//         type: 'SERVICE',
//         hsnCode: '998316',
//         sacCode: '998316',
//         gstRate: 18,
//         sellingPrice: 3000,
//         unit: 'hour',
//       },
//     }),
//     prisma.product.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'Laptop - ThinkPad T14',
//         description: 'Lenovo ThinkPad T14, i7, 16GB RAM, 512GB SSD',
//         type: 'GOODS',
//         hsnCode: '84713010',
//         gstRate: 18,
//         sellingPrice: 85000,
//         costPrice: 72000,
//         unit: 'piece',
//         stock: 15,
//         lowStockThreshold: 5,
//       },
//     }),
//     prisma.product.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'Wireless Mouse',
//         description: 'Logitech M720 Triathlon Wireless Mouse',
//         type: 'GOODS',
//         hsnCode: '84716060',
//         gstRate: 18,
//         sellingPrice: 2500,
//         costPrice: 1800,
//         unit: 'piece',
//         stock: 50,
//         lowStockThreshold: 10,
//       },
//     }),
//     prisma.product.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'USB-C Hub',
//         description: '7-in-1 USB-C docking station',
//         type: 'GOODS',
//         hsnCode: '84733020',
//         gstRate: 18,
//         sellingPrice: 3500,
//         costPrice: 2200,
//         unit: 'piece',
//         stock: 30,
//         lowStockThreshold: 8,
//       },
//     }),
//     prisma.product.create({
//       data: {
//         tenantId: tenant.id,
//         name: 'Stationery Pack',
//         description: 'Office stationery combo pack',
//         type: 'GOODS',
//         hsnCode: '48202010',
//         gstRate: 12,
//         sellingPrice: 500,
//         costPrice: 320,
//         unit: 'pack',
//         stock: 100,
//         lowStockThreshold: 20,
//       },
//     }),
//   ]);
//   console.log(`✓ Products created: ${products.length}`);

//   // ============================================
//   // 6. Create Invoices
//   // ============================================
//   // Invoice 1: Intra-state (MH → MH)
//   const inv1 = await prisma.invoice.create({
//     data: {
//       tenantId: tenant.id,
//       customerId: customers[0].id, // InfoTech, MH
//       invoiceNumber: 'TS-0001',
//       invoiceDate: new Date('2025-01-15'),
//       dueDate: new Date('2025-02-14'),
//       status: 'PAID',
//       subtotal: 125000,
//       cgst: 11250,
//       sgst: 11250,
//       igst: 0,
//       discount: 0,
//       totalAmount: 147500,
//       amountPaid: 147500,
//       isInterState: false,
//       isReverseCharge: false,
//       templateId: 1,
//       items: {
//         create: [
//           {
//             productId: products[0].id, // Web Dev
//             description: 'Web Development Service',
//             hsnCode: '998314',
//             quantity: 1,
//             unitPrice: 50000,
//             gstRate: 18,
//             taxableAmount: 50000,
//             cgst: 4500,
//             sgst: 4500,
//             igst: 0,
//             totalAmount: 59000,
//           },
//           {
//             productId: products[1].id, // Mobile App
//             description: 'Mobile App Development',
//             hsnCode: '998314',
//             quantity: 1,
//             unitPrice: 75000,
//             gstRate: 18,
//             taxableAmount: 75000,
//             cgst: 6750,
//             sgst: 6750,
//             igst: 0,
//             totalAmount: 88500,
//           },
//         ],
//       },
//     },
//   });

//   // Invoice 2: Inter-state (MH → KA)
//   const inv2 = await prisma.invoice.create({
//     data: {
//       tenantId: tenant.id,
//       customerId: customers[1].id, // DigiWave, KA
//       invoiceNumber: 'TS-0002',
//       invoiceDate: new Date('2025-02-01'),
//       dueDate: new Date('2025-03-03'),
//       status: 'ISSUED',
//       subtotal: 99000,
//       cgst: 0,
//       sgst: 0,
//       igst: 17820,
//       discount: 0,
//       totalAmount: 116820,
//       amountPaid: 0,
//       isInterState: true,
//       isReverseCharge: false,
//       templateId: 2,
//       items: {
//         create: [
//           {
//             productId: products[2].id, // Cloud hosting
//             description: 'Cloud Hosting (Annual)',
//             hsnCode: '998315',
//             quantity: 1,
//             unitPrice: 24000,
//             gstRate: 18,
//             taxableAmount: 24000,
//             cgst: 0,
//             sgst: 0,
//             igst: 4320,
//             totalAmount: 28320,
//           },
//           {
//             productId: products[1].id, // Mobile App
//             description: 'Mobile App Development',
//             hsnCode: '998314',
//             quantity: 1,
//             unitPrice: 75000,
//             gstRate: 18,
//             taxableAmount: 75000,
//             cgst: 0,
//             sgst: 0,
//             igst: 13500,
//             totalAmount: 88500,
//           },
//         ],
//       },
//     },
//   });

//   // Invoice 3: Mixed items invoice, partially paid
//   const inv3 = await prisma.invoice.create({
//     data: {
//       tenantId: tenant.id,
//       customerId: customers[2].id, // CloudNine, MH
//       invoiceNumber: 'TS-0003',
//       invoiceDate: new Date('2025-02-10'),
//       dueDate: new Date('2025-03-12'),
//       status: 'PARTIALLY_PAID',
//       subtotal: 177500,
//       cgst: 15975,
//       sgst: 15975,
//       igst: 0,
//       discount: 2500,
//       totalAmount: 206950,
//       amountPaid: 100000,
//       isInterState: false,
//       isReverseCharge: false,
//       templateId: 1,
//       items: {
//         create: [
//           {
//             productId: products[4].id, // Laptop
//             description: 'Laptop - ThinkPad T14',
//             hsnCode: '84713010',
//             quantity: 2,
//             unitPrice: 85000,
//             gstRate: 18,
//             taxableAmount: 170000,
//             cgst: 15300,
//             sgst: 15300,
//             igst: 0,
//             totalAmount: 200600,
//           },
//           {
//             productId: products[5].id, // Mouse
//             description: 'Wireless Mouse',
//             hsnCode: '84716060',
//             quantity: 3,
//             unitPrice: 2500,
//             gstRate: 18,
//             taxableAmount: 7500,
//             cgst: 675,
//             sgst: 675,
//             igst: 0,
//             totalAmount: 8850,
//           },
//         ],
//       },
//     },
//   });

//   // Invoice 4: Draft
//   const inv4 = await prisma.invoice.create({
//     data: {
//       tenantId: tenant.id,
//       customerId: customers[3].id, // RapidBuild, HR
//       invoiceNumber: 'TS-0004',
//       invoiceDate: new Date('2025-03-01'),
//       dueDate: new Date('2025-03-31'),
//       status: 'DRAFT',
//       subtotal: 60000,
//       cgst: 0,
//       sgst: 0,
//       igst: 10800,
//       discount: 0,
//       totalAmount: 70800,
//       amountPaid: 0,
//       isInterState: true,
//       isReverseCharge: false,
//       templateId: 3,
//       items: {
//         create: [
//           {
//             productId: products[3].id, // Consulting
//             description: 'IT Consulting (Hourly)',
//             hsnCode: '998316',
//             quantity: 20,
//             unitPrice: 3000,
//             gstRate: 18,
//             taxableAmount: 60000,
//             cgst: 0,
//             sgst: 0,
//             igst: 10800,
//             totalAmount: 70800,
//           },
//         ],
//       },
//     },
//   });

//   // Update tenant's last invoice number
//   await prisma.tenant.update({
//     where: { id: tenant.id },
//     data: { lastInvoiceNumber: 4 },
//   });

//   // Update customer outstanding amounts
//   await prisma.customer.update({
//     where: { id: customers[1].id },
//     data: { outstandingAmount: 116820 },
//   });
//   await prisma.customer.update({
//     where: { id: customers[2].id },
//     data: { outstandingAmount: 106950 },
//   });
//   await prisma.customer.update({
//     where: { id: customers[3].id },
//     data: { outstandingAmount: 70800 },
//   });

//   console.log(`✓ Invoices created: 4 (PAID, ISSUED, PARTIALLY_PAID, DRAFT)`);

//   // ============================================
//   // 7. Create Payments
//   // ============================================
//   await prisma.payment.create({
//     data: {
//       tenantId: tenant.id,
//       invoiceId: inv1.id,
//       amount: 147500,
//       paymentDate: new Date('2025-01-25'),
//       paymentMode: 'NEFT',
//       referenceNumber: 'NEFT-2025012501',
//       notes: 'Full payment received',
//     },
//   });

//   await prisma.payment.create({
//     data: {
//       tenantId: tenant.id,
//       invoiceId: inv3.id,
//       amount: 100000,
//       paymentDate: new Date('2025-02-20'),
//       paymentMode: 'UPI',
//       referenceNumber: 'UPI-2025022001',
//       notes: 'Partial payment - advance',
//     },
//   });
//   console.log(`✓ Payments created: 2`);

//   // ============================================
//   // 8. Create Expenses
//   // ============================================
//   const expenseData = [
//     { category: 'RENT' as const, description: 'Office rent - February 2025', amount: 45000, gstAmount: 8100, expenseDate: new Date('2025-02-01'), paymentMode: 'NEFT' as const, vendor: 'Indiabulls Properties' },
//     { category: 'SALARY' as const, description: 'Staff salaries - February 2025', amount: 250000, gstAmount: 0, expenseDate: new Date('2025-02-28'), paymentMode: 'BANK_TRANSFER' as const, vendor: 'Payroll' },
//     { category: 'UTILITIES' as const, description: 'Electricity bill - February', amount: 8500, gstAmount: 1530, expenseDate: new Date('2025-02-15'), paymentMode: 'UPI' as const, vendor: 'BSES Rajdhani' },
//     { category: 'MARKETING' as const, description: 'Google Ads campaign', amount: 15000, gstAmount: 2700, expenseDate: new Date('2025-02-10'), paymentMode: 'CARD' as const, vendor: 'Google Ads' },
//     { category: 'OFFICE_SUPPLIES' as const, description: 'Printer cartridges & paper', amount: 3500, gstAmount: 630, expenseDate: new Date('2025-02-05'), paymentMode: 'CASH' as const, vendor: 'Office World' },
//     { category: 'PROFESSIONAL_FEES' as const, description: 'CA services - quarterly filing', amount: 12000, gstAmount: 2160, expenseDate: new Date('2025-02-25'), paymentMode: 'CHEQUE' as const, vendor: 'S. Mehta & Associates' },
//     { category: 'TRAVEL' as const, description: 'Client meeting - Bangalore trip', amount: 18000, gstAmount: 900, expenseDate: new Date('2025-02-18'), paymentMode: 'CARD' as const, vendor: 'MakeMyTrip' },
//     { category: 'INSURANCE' as const, description: 'Business insurance - annual premium', amount: 35000, gstAmount: 6300, expenseDate: new Date('2025-01-15'), paymentMode: 'NEFT' as const, vendor: 'ICICI Lombard' },
//   ];

//   for (const exp of expenseData) {
//     await prisma.expense.create({
//       data: {
//         tenantId: tenant.id,
//         userId: admin.id,
//         ...exp,
//       },
//     });
//   }
//   console.log(`✓ Expenses created: ${expenseData.length}`);

//   // ============================================
//   // 9. Create Audit Logs
//   // ============================================
//   await prisma.auditLog.createMany({
//     data: [
//       { tenantId: tenant.id, userId: admin.id, action: 'CREATE', entity: 'Tenant', entityId: tenant.id, meta: { businessName: tenant.businessName } },
//       { tenantId: tenant.id, userId: admin.id, action: 'CREATE', entity: 'Invoice', entityId: inv1.id, meta: { invoiceNumber: 'TS-0001' } },
//       { tenantId: tenant.id, userId: admin.id, action: 'CREATE', entity: 'Invoice', entityId: inv2.id, meta: { invoiceNumber: 'TS-0002' } },
//       { tenantId: tenant.id, userId: admin.id, action: 'CREATE', entity: 'Invoice', entityId: inv3.id, meta: { invoiceNumber: 'TS-0003' } },
//     ],
//   });
//   console.log(`✓ Audit logs created: 4`);

//   console.log('\n✅ Database seeded successfully!');
//   console.log('\n📋 Login credentials:');
//   console.log('  Admin:      admin@techsoft.in / Admin@123');
//   console.log('  Staff:      staff@techsoft.in / Admin@123');
//   console.log('  Accountant: accountant@techsoft.in / Admin@123');
// }

// main()
//   .catch((e) => {
//     console.error('❌ Seed failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
