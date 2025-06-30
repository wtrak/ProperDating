import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Cashout() {
  const [userId, setUserId] = useState('');
  const [tokens, setTokens] = useState('');
  const [method, setMethod] = useState('crypto');
  const [wallet, setWallet] = useState('');
  const [iban, setIban] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const handleSubmit = async () => {
    if (!userId || !tokens || parseInt(tokens) < 10) {
      setStatus('❌ Minimum cashout is 10 tokens.');
      return;
    }

    const payoutData = {
      user_id: userId,
      tokens: parseInt(tokens),
      method,
      status: 'pending',
      created_at: new Date(),
      ...(method === 'crypto' ? { wallet } : { iban, name })
    };

    const { error } = await supabase.from('payout_requests').insert(payoutData);

    if (error) {
      console.error(error);
      setStatus('❌ Submission failed. Please try again.');
    } else {
      setStatus('✅ Cashout request submitted! We will review and process it shortly.');
      setTokens('');
      setWallet('');
      setIban('');
      setName('');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '700px', margin: 'auto' }}>
      <h1 style={{ fontSize: '2em', textAlign: 'center' }}>💰 Token Cashout</h1>
      <p style={{ textAlign: 'center', marginBottom: '30px' }}>
        Withdraw your tokens for real money. Minimum cashout is <strong>10 tokens</strong>.
      </p>

      <label>🔢 Tokens to Cash Out:</label>
      <input
        type="number"
        value={tokens}
        onChange={e => setTokens(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
      />

      <label>💳 Choose Payout Method:</label>
      <select
        value={method}
        onChange={e => setMethod(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
      >
        <option value="crypto">Crypto (USDT - TRC20)</option>
        <option value="bank">Bank Transfer</option>
      </select>

      {method === 'crypto' && (
        <>
          <label>🪙 Your USDT Wallet Address:</label>
          <input
            type="text"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
          />
        </>
      )}

      {method === 'bank' && (
        <>
          <label>🏦 IBAN:</label>
          <input
            type="text"
            value={iban}
            onChange={e => setIban(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <label>👤 Account Holder Name:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
          />
        </>
      )}

      <button
        onClick={handleSubmit}
        style={{
          padding: '12px 20px',
          backgroundColor: '#1e88e5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1em',
          width: '100%'
        }}
      >
        📤 Submit Cashout Request
      </button>

      {status && <p style={{ marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>{status}</p>}
    </div>
  );
}
