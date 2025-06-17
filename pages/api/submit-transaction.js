import { supabase } from '../../supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  const { txid, type, user_id } = req.body

  const { error } = await supabase.from('pending_payments').insert({
    user_id,
    txid,
    payment_type: type
  })

  if (error) {
    console.error(error)
    return res.status(500).send('Error saving transaction')
  }

  res.redirect('/thank-you')
}
