import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Loader from '../../components/Loader';
import { useGetSalesReportQuery, useGetTopProductsQuery } from '../../slices/ordersApiSlice';

const formatPeso = (v) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(v || 0);

const COLORS = ['#d4af37', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#1abc9c', '#f39c12', '#e67e22'];

// ── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ title, value, icon, color, sub }) => (
  <div style={{
    flex: '1 1 180px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderTop: `4px solid ${color}`,
    borderRadius: '14px',
    padding: '18px 20px',
  }}>
    <div style={{ fontSize: '26px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>{title}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
  </div>
);

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--accent)',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
    }}>
      <p style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '6px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.name === 'Orders' ? p.value : formatPeso(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AccountingScreen = () => {
  const [period, setPeriod] = useState('monthly');

  const { data: reportData, isLoading: loadingReport } = useGetSalesReportQuery(period);
  const { data: topProducts, isLoading: loadingProducts } = useGetTopProductsQuery();

  if (loadingReport || loadingProducts) return <Loader />;

  const summary    = reportData?.summary    || {};
  const chartData  = reportData?.chartData  || [];

  // Format X-axis labels
  const formatLabel = (key) => {
    if (period === 'monthly') {
      const [yr, mo] = key.split('-');
      return new Date(yr, mo - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    }
    if (period === 'weekly') return `Wk ${key.substring(5, 10)}`;
    return key.substring(5); // MM-DD
  };

  const displayData = chartData.map((d) => ({ ...d, label: formatLabel(d.period) }));

  // Pie data for breakdown
  const pieData = [
    { name: 'Items',    value: summary.totalItemsSales || 0 },
    { name: 'Shipping', value: summary.totalShipping   || 0 },
    { name: 'VAT',      value: summary.totalTax        || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ padding: '8px 0' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '26px', margin: 0 }}>
            💰 Accounting & Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px', margin: '4px 0 0' }}>
            Financial overview and sales analytics
          </p>
        </div>
        {/* Period Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: `1px solid ${period === p ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: period === p ? 'var(--accent)' : 'var(--bg-card)',
                color: period === p ? 'var(--btn-text)' : 'var(--text-main)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
        <SummaryCard title='Total Revenue'     value={formatPeso(summary.totalRevenue)}    icon='💰' color='#d4af37' />
        <SummaryCard title='Total Orders'      value={summary.totalOrders || 0}            icon='🛒' color='#3498db' sub={`${summary.totalCancelled || 0} cancelled`} />
        <SummaryCard title='Avg Order Value'   value={formatPeso(summary.avgOrderValue)}   icon='📈' color='#2ecc71' />
        <SummaryCard title='Total Shipping'    value={formatPeso(summary.totalShipping)}   icon='🚚' color='#9b59b6' />
        <SummaryCard title='Total VAT'         value={formatPeso(summary.totalTax)}        icon='🧾' color='#e67e22' />
        <SummaryCard title='Net Item Sales'    value={formatPeso(summary.totalItemsSales)} icon='📦' color='#1abc9c' />
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '28px' }}>

        {/* LINE CHART — Revenue Trend */}
        <div style={{
          flex: '2 1 500px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '20px',
        }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--accent)', fontWeight: '800', fontSize: '15px' }}>
            📈 Revenue Trend ({period})
          </h3>
          <ResponsiveContainer width='100%' height={260}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis dataKey='label' tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type='monotone' dataKey='sales' name='Revenue' stroke='#d4af37' strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART — Revenue Breakdown */}
        <div style={{
          flex: '1 1 260px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '20px',
        }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--accent)', fontWeight: '800', fontSize: '15px' }}>
            🥧 Revenue Breakdown
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width='100%' height={260}>
              <PieChart>
                <Pie data={pieData} cx='50%' cy='50%' outerRadius={90} dataKey='value' label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatPeso(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '60px' }}>No data</p>
          )}
        </div>
      </div>

      {/* BAR CHART — Orders Count */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '28px',
      }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--accent)', fontWeight: '800', fontSize: '15px' }}>
          📊 Orders Count ({period})
        </h3>
        <ResponsiveContainer width='100%' height={220}>
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
            <XAxis dataKey='label' tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey='orders' name='Orders' fill='#3498db' radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TOP PRODUCTS TABLE */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-soft)',
          borderBottom: '2px solid var(--accent)',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--accent)' }}>
            🏆 Top Selling Products
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-soft)' }}>
                {['Rank', 'Product Name', 'Qty Sold', 'Revenue'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '12px', fontWeight: '700', color: 'var(--accent)',
                    letterSpacing: '1px', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(topProducts || []).map((p, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: i < 3 ? '#d4af37' : 'var(--bg-soft)',
                      color: i < 3 ? '#000' : 'var(--text-muted)',
                      borderRadius: '50%', width: '28px', height: '28px',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '13px',
                    }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontWeight: '600' }}>{p.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>{p.qtySold} pcs</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent)', fontWeight: '700' }}>{formatPeso(p.revenue)}</td>
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