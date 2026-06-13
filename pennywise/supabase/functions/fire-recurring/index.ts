import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../../../types/database.ts'

type RecurringRuleRow = {
  id: string
  user_id: string
  category_id: string
  amount: string
  note: string | null
  frequency: string | null
  next_fire_at: string
}

function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function advanceFireDate(nextFireAt: string, frequency: string | null): string {
  const date = new Date(nextFireAt)
  if (frequency === 'weekly') {
    date.setUTCDate(date.getUTCDate() + 7)
    return date.toISOString()
  }

  date.setUTCMonth(date.getUTCMonth() + 1)
  return date.toISOString()
}

Deno.serve(async () => {
  const errors: string[] = []
  let fired = 0

  try {
    const supabase = createServiceClient()

    const { data: rules, error: rulesError } = await supabase
      .from('recurring_rules')
      .select('id, user_id, category_id, amount, note, frequency, next_fire_at')
      .lte('next_fire_at', new Date().toISOString())

    if (rulesError) {
      throw new Error(rulesError.message)
    }

    for (const rule of (rules ?? []) as RecurringRuleRow[]) {
      try {
        const { error: insertError } = await supabase.from('transactions').insert({
          user_id: rule.user_id,
          category_id: rule.category_id,
          amount: rule.amount,
          note: rule.note,
          source: 'recurring',
        })

        if (insertError) throw new Error(insertError.message)

        const { error: updateError } = await supabase
          .from('recurring_rules')
          .update({ next_fire_at: advanceFireDate(rule.next_fire_at, rule.frequency) })
          .eq('id', rule.id)

        if (updateError) throw new Error(updateError.message)

        fired += 1
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    return new Response(JSON.stringify({ fired, errors }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return new Response(JSON.stringify({ fired, errors }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    })
  }
})
