import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from '../../slices/productsApiSlice';

const AdminSettingsScreen = () => {
  const { data: settings, isLoading, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: loadingUpdate }] = useUpdateSettingsMutation();

  const [visayas,  setVisayas]  = useState('');
  const [mindanao, setMindanao] = useState('');
  const [luzon,    setLuzon]    = useState('');
  const [def,      setDef]      = useState('');

  useEffect(() => {
    if (settings) {
      setVisayas(settings.shippingFees?.visayas   ?? 80);
      setMindanao(settings.shippingFees?.mindanao ?? 150);
      setLuzon(settings.shippingFees?.luzon       ?? 200);
      setDef(settings.shippingFees?.default       ?? 150);
    }
  }, [settings]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        shippingFees: {
          visayas:  Number(visayas),
          mindanao: Number(mindanao),
          luzon:    Number(luzon),
          default:  Number(def),
        },
        vatRate: 0, // ✅ Always 0 — VAT tangtang na
      }).unwrap();
      toast.success('Settings updated successfully!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-soft)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    padding: '10px 14px',
    fontSize: '15px',
    fontWeight: '600',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const SectionCard = ({ title, icon, children }) => (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'var(--bg-soft)',
        borderBottom: '2px solid var(--accent)',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--accent)' }}>
          {icon} {title}
        </h3>
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  );

  if (isLoading) return <Loader />;

  return (
    <div style={{ maxWidth: '600px' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '24px', margin: 0 }}>
          ⚙️ Store Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Manage shipping fees per region
        </p>
      </div>

      <form onSubmit={submitHandler}>

        {/* SHIPPING FEES */}
        <SectionCard title='Shipping Fees' icon='🚚'>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            <div>
              <label style={labelStyle}>Within Visayas (₱)</label>
              <input
                type='number' min='0'
                value={visayas}
                onChange={(e) => setVisayas(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Cebu, Ormoc, Iloilo, Bacolod...
              </small>
            </div>

            <div>
              <label style={labelStyle}>Visayas → Mindanao (₱)</label>
              <input
                type='number' min='0'
                value={mindanao}
                onChange={(e) => setMindanao(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Davao, CDO, Zamboanga...
              </small>
            </div>

            <div>
              <label style={labelStyle}>Visayas → Luzon (₱)</label>
              <input
                type='number' min='0'
                value={luzon}
                onChange={(e) => setLuzon(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Manila, Quezon, Cavite...
              </small>
            </div>

            <div>
              <label style={labelStyle}>Default / Others (₱)</label>
              <input
                type='number' min='0'
                value={def}
                onChange={(e) => setDef(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Fallback for unrecognized cities
              </small>
            </div>

          </div>

          {/* SHIPPING PREVIEW */}
          <div style={{
            marginTop: '16px',
            backgroundColor: 'var(--bg-soft)',
            border: '1px solid var(--accent)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
          }}>
            <strong style={{ color: 'var(--accent)' }}>Preview:</strong>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'Within Visayas', val: visayas },
                { label: 'Visayas → Mindanao', val: mindanao },
                { label: 'Visayas → Luzon', val: luzon },
                { label: 'Default / Others', val: def },
              ].map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
                  <span>{r.label}</span>
                  <strong style={{ color: 'var(--accent)' }}>₱{Number(r.val).toLocaleString('en-PH')}</strong>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* SAVE BUTTON */}
        <button
          type='submit'
          disabled={loadingUpdate}
          style={{
            width: '100%',
            backgroundColor: 'var(--accent)',
            color: 'var(--btn-text)',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontWeight: '800',
            fontSize: '15px',
            cursor: loadingUpdate ? 'not-allowed' : 'pointer',
            opacity: loadingUpdate ? 0.7 : 1,
            transition: 'opacity 0.2s',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => { if (!loadingUpdate) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { if (!loadingUpdate) e.currentTarget.style.opacity = '1'; }}
        >
          {loadingUpdate ? '⏳ Saving...' : '💾 Save Settings'}
        </button>

        {loadingUpdate && <Loader />}
      </form>
    </div>
  );
};

export default AdminSettingsScreen;