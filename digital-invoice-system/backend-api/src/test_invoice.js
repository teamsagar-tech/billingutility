require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'digital_invoice'
  });

  const [rows] = await connection.query(`
    SELECT users.email, tenants.api_token 
    FROM users 
    JOIN tenants ON users.tenant_id = tenants.id 
    WHERE users.email = 'test@test.com'
  `);

  if (rows.length === 0) {
    console.log("Account test@test.com not found!");
    process.exit(1);
  }

  const apiToken = rows[0].api_token;
  console.log(`Found API Token for test@test.com: ${apiToken}`);

  // Send Mock Invoice
  const invoicePayload = {
    receiptData: {
      StoreName: "Sainath Wholesale Textile Market",
      customerPhone: "919876543210",
      BillTotal: "899.00",
      Items: [
        { Name: "Premium Coffee", Qty: 2, Price: 150 },
        { Name: "Muffin", Qty: 1, Price: 150 },
        { Name: "Macbook Sleeve", Qty: 1, Price: 449 }
      ],
      Date: new Date().toISOString()
    }
  };

  const response = await fetch('http://localhost:4000/api/v1/invoices/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': apiToken
    },
    body: JSON.stringify(invoicePayload)
  });

  const responseData = await response.json();
  console.log("Upload Response:", responseData);
  process.exit(0);
}

run();
