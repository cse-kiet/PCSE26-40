"use client"

import React, { useEffect, useMemo, useState } from "react"

type VendorBid = {
  id: string
  vendorName: string
  category: "Seeds" | "Fertilizers" | "Pesticides" | "Equipment" | "Logistics"
  item: string
  pricePerUnit: number
  unit: string
  minOrderQuantity: number
  location: string
  deliveryTimeDays: number
  validUntil: string
  phoneNumber?: string
  notes?: string
}

const BIDS: VendorBid[] = [
  {
    id: "BID-1001",
    vendorName: "GreenGrow Seeds Co.",
    category: "Seeds",
    item: "Hybrid Maize Seed MZ-101",
    pricePerUnit: 1450,
    unit: "per 10kg bag",
    minOrderQuantity: 2,
    location: "Bareilly, UP",
    deliveryTimeDays: 3,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "High germination rate, drought tolerant"
  },
  {
    id: "BID-1002",
    vendorName: "AgriNutrients Pvt Ltd",
    category: "Fertilizers",
    item: "DAP 18-46-0",
    pricePerUnit: 35,
    unit: "per kg",
    minOrderQuantity: 100,
    location: "Haldwani, UK",
    deliveryTimeDays: 2,
    validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "BID-1003",
    vendorName: "CropShield Protectants",
    category: "Pesticides",
    item: "Imidacloprid 17.8% SL",
    pricePerUnit: 780,
    unit: "per liter",
    minOrderQuantity: 5,
    location: "Rudrapur, UK",
    deliveryTimeDays: 4,
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "BID-1004",
    vendorName: "FarmTech Implements",
    category: "Equipment",
    item: "Drip Irrigation Kit (1 acre)",
    pricePerUnit: 12500,
    unit: "per kit",
    minOrderQuantity: 1,
    location: "Moradabad, UP",
    deliveryTimeDays: 6,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Includes installation support"
  },
  {
    id: "BID-1005",
    vendorName: "AgriLogix Transport",
    category: "Logistics",
    item: "Cold-chain transport (per ton)",
    pricePerUnit: 2100,
    unit: "per ton",
    minOrderQuantity: 2,
    location: "Rampur, UP",
    deliveryTimeDays: 1,
    validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "BID-1006",
    vendorName: "SoilLife Organics",
    category: "Fertilizers",
    item: "Vermicompost Premium",
    pricePerUnit: 12,
    unit: "per kg",
    minOrderQuantity: 200,
    location: "Pilibhit, UP",
    deliveryTimeDays: 3,
    validUntil: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function VendorBids() {
  const [remoteBids, setRemoteBids] = useState<VendorBid[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Google Sheet source (Published Sheet recommended)
  const SHEET_ID = "1Zmj7Zc4I3MDSX6iYN904Y1vClwIgsGsxF-q23oJPNRY"
  const SHEET_NAME = "fr1"
  const SHEET_GID = "796375197" // Provided tab gid for reliable CSV export
  const SHEET_CSV_URL = `/api/vendor-bids/sheet?sid=${encodeURIComponent(SHEET_ID)}&tab=${encodeURIComponent(SHEET_NAME)}${SHEET_GID ? `&gid=${encodeURIComponent(SHEET_GID)}` : ""}`

  const parseCsv = (csv: string): string[][] => {
    const lines = csv.replace(/\r/g, "").split("\n").filter(Boolean)
    const rows: string[][] = []
    let current: string[] = []
    let inQuotes = false
    let value = ""
    for (let line of lines) {
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            value += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          current.push(value)
          value = ""
        } else {
          value += char
        }
      }
      if (inQuotes) {
        value += "\n"
      } else {
        current.push(value)
        rows.push(current)
        current = []
        value = ""
      }
    }
    if (current.length > 0 || value) {
      current.push(value)
      rows.push(current)
    }
    return rows
  }

  const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")

  const toNumber = (s?: string) => {
    if (!s) return undefined
    const n = Number(String(s).replace(/[^0-9.\-]/g, ""))
    return isFinite(n) ? n : undefined
  }

  const loadFromSheet = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(SHEET_CSV_URL, { cache: "no-store" })
      if (!res.ok) {
        // Try to read JSON error if proxy returned helpful info
        let details = ""
        try { details = JSON.stringify(await res.json()) } catch {}
        throw new Error(`Sheet fetch failed: ${res.status}${details ? ` ${details}` : ""}`)
      }
      const csv = await res.text()
      const rows = parseCsv(csv)
      if (!rows.length) {
        setRemoteBids([])
        setLoading(false)
        return
      }
      const headers = rows[0].map(normalize)
      const dataRows = rows.slice(1)
      const findIdx = (...candidates: string[]) => {
        const normalizedCandidates = candidates.map(c => c.toLowerCase())
        const idx = headers.findIndex(h => {
          const trimmed = h.replace(/_+$/, "")
          if (normalizedCandidates.includes(h)) return true
          if (normalizedCandidates.includes(trimmed)) return true
          return normalizedCandidates.some(c => h.includes(c) || trimmed.includes(c) || c.includes(h) || c.includes(trimmed))
        })
        return idx >= 0 ? idx : -1
      }
      const idxVendor = findIdx("vendor_name", "vendor", "name", "vendorname")
      const idxCategory = findIdx("category")
      const idxItem = findIdx("item", "product", "item_name")
      const idxPrice = findIdx("price_per_unit", "price", "amount", "priceperunit")
      const idxUnit = findIdx("unit", "price_unit", "unit_per_kg", "unit_per_kg_")
      const idxMinQty = findIdx("min_order_quantity", "min_qty", "minimum_order")
      const idxLocation = findIdx("location", "city", "city_state", "location_city_state", "location_city_state_")
      const idxDelivery = findIdx("delivery_time_days", "delivery_days", "estimated_delivery")
      const idxPhone = findIdx("phone_number", "phone", "contact_number", "mobile", "mobile_number")
      const idxValid = findIdx("valid_until", "valid_till", "expiry", "valid_till_date")
      const idxNotes = findIdx("notes", "remarks")

      const parsed: VendorBid[] = dataRows
        .filter(r => r.length && (idxVendor >= 0 ? r[idxVendor] : r.some(Boolean)))
        .map((r, i) => {
          const vendorName = idxVendor >= 0 ? r[idxVendor] : `Vendor ${i + 1}`
          const categoryRaw = (idxCategory >= 0 ? r[idxCategory] : "").trim()
          const category = (["Seeds","Fertilizers","Pesticides","Equipment","Logistics"] as const).includes(categoryRaw as any)
            ? (categoryRaw as VendorBid["category"]) : "Seeds"
          const price = toNumber(idxPrice >= 0 ? r[idxPrice] : undefined)
          const minQ = toNumber(idxMinQty >= 0 ? r[idxMinQty] : undefined)
          const delivery = toNumber(idxDelivery >= 0 ? r[idxDelivery] : undefined)
          const validStr = (idxValid >= 0 ? r[idxValid] : "").trim()
          const validUntil = validStr ? new Date(validStr).toISOString() : new Date(Date.now() + 7*86400000).toISOString()
          const unitText = (idxUnit >= 0 ? (r[idxUnit] || "").trim() : "") || (idxUnit >= 0 ? "per kg" : "per unit")
          const bid: VendorBid = {
            id: `SHEET-${Date.now()}-${i}`,
            vendorName,
            category,
            item: idxItem >= 0 ? r[idxItem] : `Item ${i + 1}`,
            pricePerUnit: price ?? 0,
            unit: unitText,
            minOrderQuantity: minQ ?? 1,
            location: idxLocation >= 0 ? r[idxLocation] : "",
            deliveryTimeDays: Math.max(1, Math.round(delivery ?? 3)),
            validUntil,
            phoneNumber: idxPhone >= 0 ? (r[idxPhone] || "").trim() : undefined,
            notes: idxNotes >= 0 ? r[idxNotes] : undefined,
          }
          return bid
        })
      setRemoteBids(parsed)
    } catch (e: any) {
      console.error("Failed to load sheet bids", e)
      setError(e?.message || "Failed to load bids from sheet")
      setRemoteBids([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFromSheet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bidsToShow = useMemo(() => {
    const source = remoteBids.length ? remoteBids : BIDS
    const now = new Date()
    return source.filter(b => {
      const v = new Date(b.validUntil)
      if (!isFinite(v.getTime())) return true
      v.setHours(23,59,59,999)
      return v >= now
    })
  }, [remoteBids])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Local Vendor Bids</h3>
          <p className="text-sm text-muted-foreground">
            {remoteBids.length > 0 ? `Showing ${remoteBids.length} live submission${remoteBids.length>1?"s":""} from Google Sheet` : "Using sample bids. Connect your Google Sheet for live entries."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center h-9 rounded-md border bg-background px-3 text-sm" onClick={loadFromSheet} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bidsToShow.map((bid) => (
          <div key={bid.id} className="bg-card text-card-foreground rounded-xl border shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-start gap-2 justify-between">
              <div>
                <div className="text-base font-semibold">{bid.vendorName}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="inline-block rounded bg-muted px-2 py-0.5 mr-2 text-[10px] uppercase tracking-wide">{bid.category}</span>
                  <span>{bid.location}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Item</div>
              <div className="font-medium">{bid.item}</div>
              {bid.notes && <div className="text-xs text-muted-foreground mt-1">{bid.notes}</div>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="font-semibold">₹ {bid.pricePerUnit.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{bid.unit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Min Order</div>
                <div className="font-semibold">{bid.minOrderQuantity}</div>
                <div className="text-xs text-muted-foreground">units</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>🚚 {bid.deliveryTimeDays} days delivery</div>
              <div className="text-muted-foreground">⏳ Valid {new Date(bid.validUntil).toLocaleDateString()}</div>
            </div>

            <div className="flex gap-2 items-center">
              {bid.phoneNumber ? (
                <a
                  className="flex-1 inline-flex items-center justify-center h-9 rounded-md bg-primary text-primary-foreground px-3 text-sm"
                  href={`tel:${bid.phoneNumber.replace(/\s+/g, '')}`}
                >
                  📞 {bid.phoneNumber}
                </a>
              ) : (
                <div className="flex-1 inline-flex items-center justify-center h-9 rounded-md border bg-background px-3 text-sm text-muted-foreground">
                  No phone provided
                </div>
              )}
              <button className="inline-flex items-center justify-center h-9 rounded-md border bg-background px-3 text-sm" onClick={() => alert(`Requested quote for ${bid.item}`)}>
                Request Quote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


