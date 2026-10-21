import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, FileText, Users, DollarSign, Database, Terminal, CheckCircle } from 'lucide-react';

export default function DownloadCenter() {
  const { profile, token, notifyToast } = useOutletContext();

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type) => {
    notifyToast(`Generating ${type} export...`);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (type === 'invoices') {
        const res = await fetch('/api/v1/auth/invoices', { headers });
        const json = await res.json();
        const data = json.data || [];
        const csvHeader = 'Invoice Number,Date,Customer Name,Phone,Bill Total,WhatsApp Status,Reviewed\n';
        const csvRows = data.map((i) => `"${i.invoiceNumber || i.invoice_number || ''}","${i.createdAt || i.created_at || ''}","${i.customerName || ''}","${i.customerPhone || ''}","${i.billTotal || 0}","${i.whatsappStatus || 'delivered'}","${i.hasReviewed ? 'Yes' : 'No'}"`).join('\n');
        downloadFile(csvHeader + csvRows, `Invoices_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
        notifyToast('Invoices CSV downloaded successfully!');
      } else if (type === 'customers') {
        const res = await fetch('/api/v1/auth/customers', { headers });
        const json = await res.json();
        const data = json.data || [];
        const csvHeader = 'Customer Name,Phone,Email,Total Spent,Visits,Loyalty Points,RFM Cohort,Dormancy\n';
        const csvRows = data.map((c) => `"${c.customer_name || ''}","${c.phone || ''}","${c.email || ''}","${c.total_spent || c.lifetime_value || 0}","${c.visits_count || c.no_of_visits || 1}","${c.loyalty_points || 0}","${c.rfm_cohort || ''}","${c.dormancy || ''}"`).join('\n');
        downloadFile(csvHeader + csvRows, `Customers_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
        notifyToast('Customer CRM directory downloaded!');
      } else if (type === 'messages') {
        const res = await fetch('/api/v1/auth/invoices', { headers });
        const json = await res.json();
        const data = json.data || [];
        const csvHeader = 'Invoice Number,Recipient Phone,Dispatched At,Status,Gateway,Template Name\n';
        const csvRows = data.map((i) => `"${i.invoiceNumber || i.invoice_number || ''}","${i.customerPhone || ''}","${i.createdAt || i.created_at || ''}","${i.whatsappStatus || 'delivered'}","waba.mpocket.in","billing_receipt"`).join('\n');
        downloadFile(csvHeader + csvRows, `WABA_Messages_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
        notifyToast('WhatsApp messaging ledger exported!');
      }
    } catch (e) {
      alert('Failed to generate export file: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
          Download Center &amp; Integration Tools
        </h1>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
          Export transactional billing reports, customer CRM directories, WhatsApp messaging logs, or download the Windows POS print interceptor
        </p>
      </div>

      {/* Export Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <FileText style={{ width: '20px', height: '20px' }} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
              Sales &amp; Invoices Report (CSV)
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
              Itemized transaction log containing invoice numbers, customer phone numbers, item totals, and WhatsApp delivery logs.
            </p>
          </div>
          <button
            onClick={() => handleExport('invoices')}
            style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.825rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Download style={{ width: '15px', height: '15px' }} />
            <span>Download CSV</span>
          </button>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Users style={{ width: '20px', height: '20px' }} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
              Customer CRM Directory (Excel)
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
              Full customer database including birthdays, anniversary dates, total spend amounts, visit frequencies, and loyalty balances.
            </p>
          </div>
          <button
            onClick={() => handleExport('customers')}
            style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontSize: '0.825rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Download style={{ width: '15px', height: '15px' }} />
            <span>Download Excel</span>
          </button>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Terminal style={{ width: '20px', height: '20px' }} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
              WhatsApp Messaging &amp; Delivery Ledger (CSV)
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
              Complete log of all dispatched billing and marketing messages, recipient phones, WABA template names, and delivery statuses.
            </p>
          </div>
          <button
            onClick={() => handleExport('messages')}
            style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#d97706', color: '#ffffff', fontSize: '0.825rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Download style={{ width: '15px', height: '15px' }} />
            <span>Export Messaging Ledger</span>
          </button>
        </div>
      </div>

      {/* POS Windows Interceptor Agent Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
          POS Print Interceptor (Windows Agent)
        </h3>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
          Silently intercepts ESC/POS thermal bills from Tally, Busy, Marg, or custom billing software to dispatch WhatsApp digital bills automatically.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: '800', color: '#0369a1' }}>
              RetailNodePrintAgent.exe (Windows Thermal Print Interceptor)
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#0284c7' }}>
              Zero modification needed on your existing billing software. Reads printer spool buffer directly.
            </p>
          </div>
          <a
            href="/downloads/RetailNodePrintAgent.exe"
            download
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', textDecoration: 'none' }}
          >
            <Download style={{ width: '15px', height: '15px' }} />
            <span>Download Agent</span>
          </a>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
            Direct REST API Ingestion Payload (cURL)
          </h4>
          <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '1rem', borderRadius: '10px', fontSize: '0.75rem', overflowX: 'auto', margin: 0 }}>
{`curl -X POST https://bill.retailnode.in/api/v1/invoices \\
  -H "Content-Type: application/json" \\
  -H "x-api-token: ${profile?.api_token || 'sk_live_YOUR_API_TOKEN'}" \\
  -d '{
    "invoice_number": "INV-2026-001",
    "customer_phone": "9876543210",
    "customer_name": "Anita Sharma",
    "send_whatsapp": true,
    "receipt_data": {
      "StoreName": "${profile?.store_name || 'Retail Store'}",
      "GrandTotal": 2499.00
    }
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
