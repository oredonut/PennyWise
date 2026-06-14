// ============================================================
// Expo push notification helper. Fire-and-forget: a push failure
// must never be fatal to the caller, so all errors are swallowed.
// ============================================================

export async function sendPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'normal',
      }),
    })
  } catch {
    // Never throw — notifications are best-effort.
  }
}
