import { useState } from 'react';
import { Button } from 'react-bootstrap';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import Loader from '../../components/Loader';
import { useGetSalesReportQuery, useGetTopProductsQuery } from '../../slices/ordersApiSlice';

const formatPeso = (v) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(v || 0);

const COLORS = ['#d4af37', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#1abc9c', '#f39c12', '#e67e22'];

const SummaryCard = ({ title, value, icon, color, sub }) => (
  <div style={{
    background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #dee2e6)',
    borderRadius: '12px', padding: '20px', flex: '1', minWidth: '150px',
  }}>
    <div style={{ fontSize: '26px', marginBottom: '6px' }}>{icon}</div>
    <div style={{ fontSize: '20px', fontWeight: '800', color: color || 'inherit' }}>{value}</div>
    <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{title}</div>
    {sub && <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
      <strong>{label}</strong>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.name === 'Orders' ? p.value : formatPeso(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

// ✅ EXCEL EXPORT
const exportToExcel = (reportData, topProducts, period) => {
  const wb = XLSX.utils.book_new();
  const summary = reportData?.summary || {};
  const now = new Date().toLocaleString('en-PH');

  // Sheet 1: Summary
  const summaryRows = [
    ['CELLCOM ACCOUNTING REPORT'],
    ['Generated:', now],
    ['Period:', period.toUpperCase()],
    [],
    ['METRIC', 'VALUE'],
    ['Total Revenue (₱)', Number((summary.totalRevenue || 0).toFixed(2))],
    ['Total Orders', summary.totalOrders || 0],
    ['Cancelled Orders', summary.totalCancelled || 0],
    ['Average Order Value (₱)', Number((summary.avgOrderValue || 0).toFixed(2))],
    ['Total Shipping Collected (₱)', Number((summary.totalShipping || 0).toFixed(2))],
    ['Total VAT Collected (₱)', Number((summary.totalTax || 0).toFixed(2))],
    ['Total Items Sales (₱)', Number((summary.totalItemsSales || 0).toFixed(2))],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1['!cols'] = [{ wch: 32 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // Sheet 2: Sales by Period
  const chartData = reportData?.chartData || [];
  const salesRows = [
    ['Period', 'Revenue (₱)', 'Orders', 'Shipping (₱)', 'VAT (₱)', 'Items Sales (₱)'],
    ...chartData.map((d) => [
      d.period,
      Number((d.sales || 0).toFixed(2)),
      d.orders || 0,
      Number((d.shipping || 0).toFixed(2)),
      Number((d.tax || 0).toFixed(2)),
      Number((d.items || 0).toFixed(2)),
    ]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(salesRows);
  ws2['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, `Sales (${period})`);

  // Sheet 3: Top Products
  const prodRows = [
    ['Rank', 'Product Name', 'Qty Sold', 'Revenue (₱)'],
    ...(topProducts || []).map((p, i) => [
      i + 1, p.name, p.qtySold, Number((p.revenue || 0).toFixed(2)),
    ]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(prodRows);
  ws3['!cols'] = [{ wch: 6 }, { wch: 38 }, { wch: 12 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Top Products');

  XLSX.writeFile(wb, `CELLCOM_Accounting_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// ── MAIN ─────────────────────────────────────────────────────────────────────
const AccountingScreen = () => {
  const [period, setPeriod] = useState('monthly');

  const { data: reportData, isLoading: loadingReport } = useGetSalesReportQuery(period);
  const { data: topProducts, isLoading: loadingProducts } = useGetTopProductsQuery();

  if (loadingReport || loadingProducts) return <Loader />;

  const summary = reportData?.summary || {};
  const chartData = reportData?.chartData || [];

  const formatLabel = (key) => {
    if (period === 'monthly') {
      const [yr, mo] = key.split('-');
      return new Date(yr, mo - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    }
    if (period === 'weekly') return `Wk ${key.substring(5, 10)}`;
    return key.substring(5);
  };

  const displayData = chartData.map((d) => ({ ...d, label: formatLabel(d.period) }));

  const pieData = [
    { name: 'Items', value: summary.totalItemsSales || 0 },
    { name: 'Shipping', value: summary.totalShipping || 0 },
    { name: 'VAT', value: summary.totalTax || 0 },
  ].filter((d) => d.value > 0);

  const cardStyle = { background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #dee2e6)', borderRadius: '12px', padding: '20px' };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontWeight: '800', margin: 0 }}>💰 Accounting & Reports</h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '14px' }}>Financial overview and sales analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Period Selector */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '700', fontSize: '13px', textTransform: 'capitalize',
                border: `1px solid ${period === p ? '#d4af37' : 'var(--border, #dee2e6)'}`,
                background: period === p ? '#d4af37' : 'transparent',
                color: period === p ? '#fff' : 'inherit',
              }}>{p}</button>
            ))}
          </div>
          {/* ✅ EXPORT BUTTON */}
          <Button
            variant="success"
            onClick={() => exportToExcel(reportData, topProducts, period)}
            style={{ fontWeight: '700', borderRadius: '8px', padding: '8px 18px' }}
          >
            📊 Export to Excel
          </Button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <SummaryCard title="Total Revenue" value={formatPeso(summary.totalRevenue)} icon="💵" color="#27ae60" />
        <SummaryCard title="Total Orders" value={summary.totalOrders || 0} icon="📦" color="#3498db" />
        <SummaryCard title="Cancelled" value={summary.totalCancelled || 0} icon="❌" color="#e74c3c" />
        <SummaryCard title="Avg Order Value" value={formatPeso(summary.avgOrderValue)} icon="📊" color="#9b59b6" />
        <SummaryCard title="Total Shipping" value={formatPeso(summary.totalShipping)} icon="🚚" color="#f39c12" />
        <SummaryCard title="Total VAT" value={formatPeso(summary.totalTax)} icon="🏛️" color="#1abc9c" />
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={cardStyle}>
          <h5 style={{ fontWeight: '700', marginBottom: '16px' }}>📈 Revenue Trend ({period})</h5>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="sales" stroke="#d4af37" strokeWidth={2.5} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <h5 style={{ fontWeight: '700', marginBottom: '16px' }}>🥧 Revenue Breakdown</h5>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatPeso(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', color: '#aaa' }}>No data</div>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h5 style={{ fontWeight: '700', marginBottom: '16px' }}>📊 Orders Count ({period})</h5>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" fill="#3498db" radius={[4, 4, 0, 0]} name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TOP PRODUCTS */}
      <div style={cardStyle}>
        <h5 style={{ fontWeight: '700', marginBottom: '16px' }}>🏆 Top Selling Products</h5>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Rank', 'Product Name', 'Qty Sold', 'Revenue'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', borderBottom: '2px solid #dee2e6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(topProducts || []).map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700',
                      background: i === 0 ? '#d4af37' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#eee',
                      color: i < 3 ? '#fff' : '#666',
                    }}>{i + 1}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: '500' }}>{p.name}</td>
                  <td style={{ padding: '10px 14px' }}>{p.qtySold} pcs</td>
                  <td style={{ padding: '10px 14px', fontWeight: '700', color: '#27ae60' }}>{formatPeso(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountingScreen;