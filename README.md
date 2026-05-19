# CollectIQ

**CollectIQ** is an AI-powered voice collections dashboard for NBFCs (Non-Banking Financial Companies) and digital lending companies. It serves as the operational control center around a Bolna Voice AI agent — collections managers upload overdue borrower lists (CSV), trigger automated calling campaigns, monitor outcomes in real time, and review call transcripts, all from one interface. Built for operations teams who need to recover money efficiently, not win design awards.

---

## Architecture

```
+-------------+     +----------------+     +------------------+
|   CSV Upload | --> |   Supabase DB  | --> |   Bolna API      |
|   (/upload)  |     |   (PostgreSQL) |     |   (Voice Agent)  |
+-------------+     +----------------+     +------------------+
                           ^                         |
                           |                         v
                    +-------------+     +------------------+
                    |   Realtime  |     |   Borrower Phone |
                    |   (WebSocket)|    |   (Voice Call)   |
                    +-------------+     +------------------+
                           ^
                           |
                    +-------------+
                    |  Webhook    |
                    |  (/api/     |
                    |  webhook/   |
                    |  bolna)     |
                    +-------------+
                           |
                           v
                    +------------------+
                    |   Dashboard UI   |
                    |   (React +       |
                    |   Realtime Sub)  |
                    +------------------+
```

**Flow:**
1. Collections manager uploads CSV → Borrowers inserted into Supabase
2. Campaign created → Call records queued in Supabase
3. Manager clicks "Run Campaign" → Bolna API triggered per call
4. Bolna Voice Agent calls borrower → Conversation happens
5. Call ends → Bolna POSTs webhook to `/api/webhook/bolna`
6. Webhook updates call record in Supabase
7. Supabase Realtime pushes update to UI → Live status change

---

## Local Setup

```bash
# 1. Clone and install
cd collectiq && npm install

# 2. Set up Supabase
#    - Create project at https://supabase.com
#    - Run `supabase/schema.sql` in SQL Editor
#    - Copy project URL and anon key

# 3. Configure environment
cp .env.local.example .env.local
#    - Fill in your Supabase URL and keys

# 4. Start dev server
npm run dev
```

**Dependencies:** Node.js 20+, npm 10+

---

## Webhook Setup

For local development, you need a public URL that Bolna can reach:

```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Start your dev server (runs on :5173)
npm run dev

# 3. In another terminal, expose it publicly
ngrok http 5173

# 4. Copy the HTTPS URL from ngrok output
#    Example: https://abc123.ngrok-free.app

# 5. In Bolna dashboard, set webhook URL:
#    https://abc123.ngrok-free.app/api/webhook/bolna

# 6. Set webhook secret in Bolna and add to .env.local:
#    BOLNA_WEBHOOK_SECRET=your-secret
```

For production, deploy to Vercel and use your production domain as the webhook URL.

---

## CSV Format

Upload a `.csv` file with these columns:

```csv
name,phone,loan_account,overdue_amount,due_date,language,bucket
Rajesh Kumar,9876543210,LN2024001,45000,2024-11-15,hindi,31-60
Priya Sharma,9123456789,LN2024002,18500,2024-11-10,english,0-30
Amit Patel,9988776655,LN2024003,125000,2024-10-28,hindi,61-90
Sneha Gupta,9876512345,LN2024004,67000,2024-11-05,english,31-60
```

| Column | Required | Description |
|--------|----------|-------------|
| `name` | Yes | Borrower full name |
| `phone` | Yes | 10-digit mobile number |
| `loan_account` | Yes | Internal loan/account ID |
| `overdue_amount` | Yes | Overdue amount in ₹ |
| `due_date` | Yes | Due date (YYYY-MM-DD) |
| `language` | No | `hindi` or `english` (default: `hindi`) |
| `bucket` | No | `0-30`, `31-60`, `61-90`, `90+` (default: `0-30`) |

Column names are auto-detected. Alternative headers accepted (e.g., `borrower_name`, `mobile`, `outstanding`, etc.).

---

## Outcome Metrics Explained

| Metric | Definition |
|--------|------------|
| **PTP Rate** | Promise-to-Pay Rate — % of completed calls where the borrower committed to pay. Calculated as: `PTP Confirmed / Completed Calls × 100` |
| **Connect Rate** | % of dialed calls that were successfully answered and completed. Calculated as: `Completed Calls / Total Dialed × 100` |
| **Total PTP Amount** | Sum of all rupee amounts that borrowers promised to pay. Displayed in ₹ L (Lakhs) or ₹ Cr (Crores) |
| **Cost per PTP** | (Not yet tracked) Will be: `Total campaign cost / Number of PTPs confirmed` |

**Outcomes:**
- `ptp_confirmed` — Borrower promised to pay on a specific date
- `disputed` — Borrower disputes the dues
- `callback_requested` — Borrower asked for a callback
- `escalate` — Call needs human agent follow-up
- `no_answer` — Call not answered
- `failed` — Technical failure

---

## Week 2 Roadmap

- **Automatic retry logic** — Retry failed/no-answer calls up to 3 times with exponential backoff; configurable retry windows (e.g., only retry between 10 AM - 6 PM)
- **WhatsApp follow-up after PTP** — Send automated WhatsApp message to borrower confirming PTP date and payment link; reduces missed PTPs by ~25%
- **RBI compliance audit log** — Immutable log of all agent-borrower interactions with consent timestamps; exportable PDF for regulatory audits; 7-year retention

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth |
| File Parsing | PapaParse (CSV) |
| Charts | Recharts |
| HTTP | Native fetch |
| Icons | Lucide React |
| Fonts | IBM Plex Mono (data) + DM Sans (UI) |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_BOLNA_API_KEY` | Bolna API key for initiating calls |
| `VITE_BOLNA_AGENT_ID` | Bolna voice agent ID |
| `VITE_BOLNA_WEBHOOK_SECRET` | Shared secret for webhook validation |

---

## File Structure

```
├── supabase/
│   └── schema.sql              # Database schema + policies + realtime
├── .env.local.example          # Environment variable template
├── src/
│   ├── App.tsx                 # Root layout + routing
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles + design system
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── lib/
│   │   ├── utils.ts            # formatINR, formatDuration, etc.
│   │   ├── supabase.ts         # Supabase client + CRUD
│   │   └── bolna.ts            # Bolna API wrapper
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   │   ├── MetricCard.tsx  # KPI card with counter animation
│   │   │   ├── StatusChip.tsx  # Status badge with pulse dot
│   │   │   ├── CallTable.tsx   # Data table with hover states
│   │   │   ├── UploadZone.tsx  # Drag-drop file upload
│   │   │   └── Sparkline.tsx   # Mini sparkline chart
│   │   └── charts/
│   │       ├── OutcomeDonut.tsx # Donut chart for outcomes
│   │       └── CallVolumeBar.tsx # Bar chart for hourly volume
│   └── pages/
│       ├── DashboardPage.tsx   # Main dashboard
│       ├── CampaignsPage.tsx   # Campaign list
│       ├── CampaignDetailPage.tsx # Campaign detail + call queue
│       ├── UploadPage.tsx      # CSV upload + preview
│       ├── CallDetailPage.tsx  # Single call transcript
│       └── AnalyticsPage.tsx   # Analytics view
└── README.md
```

---

## License

Private — internal use only.
