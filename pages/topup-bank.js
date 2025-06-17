import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function BankTransfer() {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const handleSubmit = async () => {
    if (!transactionId || !userId) return;
    await supabase.from('bank_topups').insert([{ user_id: userId, transaction_id: transactionId }]);
    alert('✅ Transaction submitted! We will verify and credit your account.');
    setTransactionId('');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2em' }}>🏦 Bank Transfer</h1>

      <p style={{ textAlign: 'center', color: 'red', fontWeight: 'bold' }}>
        ⚠️ Minimum payment is <strong>40 PLN</strong>. Payments below this amount will not be credited or refunded.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
        {/* QR CODE OPTION */}
        <div style={{ flex: 1, minWidth: '320px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#1e88e5' }}>📲 Fast QR Payment</h2>
          <p>Fill in your amount and email. We’ll generate a payment QR code or link sent to your email.</p>

          <label>💰 Amount (PLN):</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', marginBottom: '15px', padding: '10px', backgroundColor: 'white' }}
          />

          <label>📧 Your Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', marginBottom: '15px', padding: '10px', backgroundColor: 'white' }}
          />

          <button style={{ padding: '12px 20px', backgroundColor: '#1e88e5', color: 'white', border: 'none', borderRadius: '6px' }}>
            📤 Send QR to My Email
          </button>
        </div>

        {/* MANUAL OPTION */}
        <div style={{ flex: 1, minWidth: '320px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#43a047' }}>✍️ Manual Bank Transfer</h2>
          <p>Use these bank details to make a manual transfer:</p>

          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Bank:</strong> Revolut</li>
            <li><strong>IBAN:</strong> <code>PL00 0000 0000 0000 0000 0000 0000</code></li>
            <li><strong>SWIFT:</strong> REVOGB21</li>
            <li><strong>Recipient Name:</strong> Will appear automatically</li>
            <li><strong>Transfer Title:</strong> <code>{userId || 'your-user-id'}</code></li>
          </ul>

          <p style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>
            ⚠️ Only payments of 40 PLN or more will be credited.
          </p>
        </div>
      </div>

      {/* TRANSACTION SUBMISSION */}
      <div style={{ marginTop: '50px', padding: '30px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.3em', marginBottom: '10px' }}>📨 Submit Your Transaction Confirmation</h2>
        <p style={{ color: '#555' }}>
          After making the transfer, paste your transaction ID or confirmation number below so we can verify it.
        </p>

        <textarea
          rows={3}
          placeholder="Paste your transaction ID here..."
          value={transactionId}
          onChange={e => setTransactionId(e.target.value)}
          style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: 'white' }}
        />

        <p style={{ color: 'red', fontStyle: 'italic', marginTop: '10px' }}>
          Only payments of <strong>40 PLN or more</strong> will be credited.
        </p>

        <button onClick={handleSubmit} style={{ marginTop: '15px', padding: '12px 20px', backgroundColor: '#1e88e5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1em' }}>
          ✅ Submit Payment
        </button>
      </div>
    </div>
  );
}
