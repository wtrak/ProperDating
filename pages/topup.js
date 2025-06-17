import Link from 'next/link'

export default function Topup() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '800px', margin: 'auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.2em', marginBottom: '20px' }}>💳 Choose Your Payment Method</h1>
      <p style={{ fontSize: '1.1em', marginBottom: '40px', color: '#555' }}>
        Select how you’d like to top up your account. All options require a minimum payment and a transaction confirmation.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
        <Link href="/topup-crypto">
          <div style={{
            cursor: 'pointer',
            padding: '30px',
            borderRadius: '12px',
            backgroundColor: '#f0f9ff',
            border: '2px solid #1e88e5',
            width: '300px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s',
          }}>
            <h2 style={{ color: '#1e88e5', marginBottom: '10px' }}>🔐 Crypto Payment</h2>
            <p style={{ fontSize: '0.95em', color: '#444' }}>Pay with USDT (TRC20). Fast, Global.</p>
          </div>
        </Link>

        <Link href="/topup-bank">
          <div style={{
            cursor: 'pointer',
            padding: '30px',
            borderRadius: '12px',
            backgroundColor: '#f3fff0',
            border: '2px solid #43a047',
            width: '300px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s',
          }}>
            <h2 style={{ color: '#43a047', marginBottom: '10px' }}>🏦 Bank Transfer</h2>
            <p style={{ fontSize: '0.95em', color: '#444' }}>Pay with direct bank transfer.</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
