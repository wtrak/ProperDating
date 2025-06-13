import { supabase } from '../supabaseClient'

export async function transferTokens(fromId, toId, amount) {
  const { data, error } = await supabase.rpc('transfer_tokens', {
    from_id: fromId,
    to_id: toId,
    amount,
  })

  if (error) {
    console.error('Token transfer error:', error.message)
    return false
  }

  return data
}

export async function submitDateApplication({
  supporterId,
  creatorId,
  tokenFee,
  proposed_date,
  proposed_time,
  location,
  plan,
  gift_ideas
}) {
  const success = await transferTokens(supporterId, creatorId, tokenFee)
  if (!success) {
    return { success: false, message: 'Not enough tokens' }
  }

  const { error } = await supabase.from('date_applications').insert([
    {
      supporter_id: supporterId,
      creator_id: creatorId,
      token_fee: tokenFee, // ✅ make sure this is included
      proposed_date,
      proposed_time,
      location,
      plan,
      gift_ideas
    }
  ])

  if (error) {
    console.error('Date application error:', error.message)
    return { success: false, message: error.message }
  }

  return { success: true }
}
