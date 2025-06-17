import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Topup() {
  const wallet = 'TGW56spanMC3ywvMh5JPP3Dkd3BzjuemHy';
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState('');
  const [txid, setTxid] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitTxid = async () => {
    if (!txid || !userId) return;
    const { error } = await supabase.from('pending_payments').insert({
      user_id: userId,
      txid,
      payment_type: 'crypto'
    });
    if (error) {
        console.error('Supabase Error:', error.message, error.details);
      setSubmitStatus('❌ Submission failed. Try again.');
    } else {
      setSubmitStatus('✅ Submitted! We’ll verify and credit your tokens shortly.');
      setTxid('');
    }
  };

  const linkStyle = {
    color: '#1e88e5',
    textDecoration: 'underline',
    fontWeight: 'bold'
  };

  const boxStyle = {
    flex: 1,
    minWidth: '320px',
    padding: '25px',
    borderRadius: '12px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '2em' }}>💸 Token Top-Up</h1>

      <p style={{ textAlign: 'center', color: 'red', fontWeight: 'bold', fontSize: '1.1em', marginBottom: '30px' }}>
        ⚠️ Minimum payment is <strong>10 USDT (TRC20)</strong>. Payments under this amount will <u>NOT</u> be credited or refunded.
      </p>

      <p style={{ textAlign: 'center', marginBottom: '40px', color: '#555' }}>
        Choose the option that matches your experience level.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
        <div style={boxStyle}>
          <h2 style={{ fontSize: '1.4em', color: '#1e88e5', marginBottom: '15px' }}>✅ I Already Know How to Pay with Crypto</h2>
          <p style={{ fontWeight: 'bold' }}>Steps:</p>
          <ol style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li>Send <strong>USDT (TRC20)</strong> to the wallet address below.</li>
            <li>Submit your transaction ID using the form at the bottom of this page.</li>
          </ol>
          <p style={{ color: 'red', fontWeight: 'bold', marginTop: '15px' }}>
            ⚠️ Minimum: 10 USDT — Do not send less.
          </p>
          <p style={{ fontWeight: 'bold' }}>Wallet Address:</p>
          <code style={{ background: '#eee', padding: '10px', display: 'block', marginBottom: '10px', wordBreak: 'break-word' }}>{wallet}</code>
          <button onClick={copyToClipboard} style={{ marginBottom: '15px' }}>
            {copied ? '✅ Copied!' : '📋 Copy Wallet Address'}
          </button>
          <p style={{ fontWeight: 'bold' }}>Scan QR:</p>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallet}`} alt="QR Code" />
        </div>

        <div style={boxStyle}>
          <h2 style={{ fontSize: '1.4em', color: '#43a047', marginBottom: '15px' }}>🆕 I’m New — Show Me How to Pay with Crypto</h2>
          <p style={{ fontWeight: 'bold' }}>Steps:</p>
          <ol style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li>Download a wallet:
              <ul style={{ paddingLeft: '20px' }}>
                <li><a href="https://trustwallet.com" target="_blank" rel="noreferrer" style={linkStyle}>Trust Wallet</a></li>
                <li><a href="https://www.tronlink.org/" target="_blank" rel="noreferrer" style={linkStyle}>TronLink Wallet</a></li>
              </ul>
            </li>
            <li>Buy USDT (TRC20) from:
              <ul style={{ paddingLeft: '20px' }}>
                <li><a href="https://zonda.global" target="_blank" rel="noreferrer" style={linkStyle}>Zonda</a></li>
                <li><a href="https://binance.com" target="_blank" rel="noreferrer" style={linkStyle}>Binance</a></li>
              </ul>
            </li>
            <li>Send 10+ USDT (TRC20) to the wallet address below.</li>
            <li>Submit your transaction ID using the form at the bottom of this page.</li>
          </ol>
          <p style={{ color: 'red', fontWeight: 'bold', marginTop: '15px' }}>
            ⚠️ Minimum: 10 USDT — Do not send less.
          </p>
          <p style={{ fontWeight: 'bold' }}>Wallet Address:</p>
          <code style={{ background: '#eee', padding: '10px', display: 'block', marginBottom: '10px', wordBreak: 'break-word' }}>{wallet}</code>
          <button onClick={copyToClipboard} style={{ marginBottom: '15px' }}>
            {copied ? '✅ Copied!' : '📋 Copy Wallet Address'}
          </button>
          <p style={{ fontWeight: 'bold' }}>Scan QR:</p>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallet}`} alt="QR Code" />
        </div>
      </div>

      <div style={{ marginTop: '50px', padding: '30px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h2 style={{ fontSize: '1.3em', marginBottom: '10px' }}>📨 Submit Your Transaction ID</h2>
        <p style={{ color: '#555' }}>
          Your personal payment code: <code style={{ fontWeight: 'bold' }}>TOPUP-{userId || '[loading...]'}</code>
        </p>
        <textarea
          rows={3}
          placeholder="Paste your transaction ID here..."
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          style={{ width: '100%', padding: '10px', marginTop: '10px' }}
        ></textarea>
        <p style={{ color: 'red', fontStyle: 'italic', marginTop: '10px' }}>
          Only payments of <strong>10 USDT or more</strong> will be credited. Smaller amounts are ignored and non-refundable.
        </p>
        <button onClick={submitTxid} style={{ marginTop: '15px', padding: '12px 20px', backgroundColor: '#1e88e5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1em' }}>
          ✅ Submit Payment
        </button>
        {submitStatus && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{submitStatus}</p>}
      </div>
    </div>
  );
}
