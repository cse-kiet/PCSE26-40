import { NextRequest, NextResponse } from "next/server"

// Proxy Google Sheets CSV to avoid client-side CORS issues.
// Usage: /api/vendor-bids/sheet?sid=SPREADSHEET_ID&tab=SHEET_NAME[&gid=SHEET_GID]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sid = searchParams.get("sid")
  const tab = searchParams.get("tab")
  const gid = searchParams.get("gid")

  if (!sid || !tab) {
    return NextResponse.json({ error: "Missing sid or tab" }, { status: 400 })
  }

  const candidates: string[] = []
  // 1) export by sheet name
  candidates.push(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(sid)}/export?format=csv&sheet=${encodeURIComponent(tab)}`)
  // 2) gviz CSV by sheet name
  candidates.push(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(sid)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`)
  // 3) export by gid if provided
  if (gid) {
    candidates.push(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(sid)}/export?format=csv&gid=${encodeURIComponent(gid)}`)
    // 4) published CSV by gid (requires Publish to web)
    candidates.push(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(sid)}/pub?gid=${encodeURIComponent(gid)}&single=true&output=csv`)
  }

  const errors: Array<{ url: string; status?: number; message?: string }> = []
  for (const url of candidates) {
    try {
      const r = await fetch(url, { cache: "no-store" })
      if (r.ok) {
        const csv = await r.text()
        return new NextResponse(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        })
      } else {
        errors.push({ url, status: r.status })
      }
    } catch (e: any) {
      errors.push({ url, message: e?.message })
    }
  }

  return NextResponse.json(
    {
      error: "All upstream fetch attempts failed",
      hints: [
        "Ensure the sheet is shared publicly or published to the web",
        "Verify sheet ID (sid) and tab name (tab) are correct",
        gid ? "Verify gid corresponds to the tab" : "Optionally provide gid= for the tab",
      ],
      attempts: errors,
    },
    { status: 502 }
  )
}


