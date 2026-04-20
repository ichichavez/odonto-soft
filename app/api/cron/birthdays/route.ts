import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

/**
 * GET /api/cron/birthdays
 *
 * Cron job that runs daily at 07:00 local time (11:00 UTC) via Vercel Cron.
 * Finds all patients with a birthday today (same month + day) and creates a
 * notification for every user in that patient's clinic.
 *
 * Security: Vercel sends the CRON_SECRET in the Authorization header.
 * We also allow requests without it in development/test environments.
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel adds this automatically when configured)
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServerClient()

  // Determine today's date in Paraguay time (UTC-4).
  // We use a fixed offset for simplicity; Paraguay alternates between UTC-4 and UTC-3.
  const now = new Date()
  const paraguayOffset = -4 * 60 // minutes
  const local = new Date(now.getTime() + (paraguayOffset - now.getTimezoneOffset()) * 60000)
  const todayMonth = local.getMonth() + 1 // 1-12
  const todayDay   = local.getDate()      // 1-31

  try {
    // 1. Find all patients with a birthday today.
    //    birth_date is stored as YYYY-MM-DD.
    //    We use Postgres EXTRACT to match month + day regardless of year.
    const { data: patients, error: pErr } = await supabase
      .from("patients")
      .select("id, first_name, last_name, birth_date, clinic_id")
      .not("birth_date", "is", null)

    if (pErr) throw pErr

    const todayBirthdays = (patients ?? []).filter((p) => {
      if (!p.birth_date) return false
      const bd = new Date(p.birth_date + "T00:00:00")
      return bd.getMonth() + 1 === todayMonth && bd.getDate() === todayDay
    })

    if (todayBirthdays.length === 0) {
      return NextResponse.json({ message: "No birthdays today", count: 0 })
    }

    // 2. For each birthday patient, create notifications for all users in their clinic.
    let totalNotifications = 0

    for (const patient of todayBirthdays) {
      if (!patient.clinic_id) continue

      // Get all users in the patient's clinic
      const { data: clinicUsers, error: uErr } = await supabase
        .from("users")
        .select("id")
        .eq("clinic_id", patient.clinic_id)

      if (uErr) {
        console.error(`Error fetching users for clinic ${patient.clinic_id}:`, uErr)
        continue
      }
      if (!clinicUsers || clinicUsers.length === 0) continue

      // Dedup: skip if a birthday notification already exists today for this patient
      const todayStr = local.toISOString().split("T")[0]
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("link", `/pacientes/${patient.id}`)
        .gte("created_at", `${todayStr}T00:00:00`)
        .ilike("title", "%cumpleaños%")
        .limit(1)

      if (existing && existing.length > 0) {
        // Already sent today
        continue
      }

      // Build notification rows
      const age = todayMonth > 0
        ? local.getFullYear() - new Date(patient.birth_date! + "T00:00:00").getFullYear()
        : null

      const rows = clinicUsers.map((u) => ({
        user_id: u.id,
        title: `🎂 Cumpleaños: ${patient.first_name} ${patient.last_name}`,
        message: age
          ? `${patient.first_name} ${patient.last_name} cumple ${age} años hoy.`
          : `${patient.first_name} ${patient.last_name} cumple años hoy.`,
        type: "info",
        read: false,
        link: `/pacientes/${patient.id}`,
      }))

      const { error: nErr } = await supabase.from("notifications").insert(rows)
      if (nErr) {
        console.error(`Error creating birthday notifications for patient ${patient.id}:`, nErr)
      } else {
        totalNotifications += rows.length
      }
    }

    return NextResponse.json({
      message: "Birthday notifications sent",
      birthdays: todayBirthdays.length,
      notifications: totalNotifications,
    })
  } catch (err: any) {
    console.error("Birthday cron error:", err)
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}
