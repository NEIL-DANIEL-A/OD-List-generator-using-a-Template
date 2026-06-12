# AttendPDF - Attendance Sheet PDF Generator

A full-stack web application built with Next.js 15, TypeScript, Tailwind CSS, and PostgreSQL for generating professional attendance sheet PDFs from Excel files.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **File Processing:** xlsx
- **PDF Generation:** pdf-lib

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository and install dependencies:

```bash
cd attendance-app
npm install
```

2. Configure environment variables:

```bash
# Edit .env file
DATABASE_URL="postgresql://username:password@localhost:5432/attendancedb?schema=public"
```

3. Run database migrations:

```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Place your `attendance_template.png` in the `public/` directory.

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx            # Dashboard home
│   │   ├── events/page.tsx     # Event management CRUD
│   │   ├── attendance/page.tsx # Attendance generator
│   │   ├── generated-pdfs/page.tsx # View generated PDFs
│   │   ├── admin/calibration/page.tsx # Coordinate calibration
│   │   └── settings/page.tsx   # Settings page
│   ├── api/
│   │   ├── events/route.ts     # GET, POST events
│   │   ├── events/[id]/route.ts # PUT, DELETE event
│   │   ├── upload-excel/route.ts # Parse Excel files
│   │   ├── generate-pdf/route.ts # Generate attendance PDFs
│   │   ├── generated-pdfs/route.ts # List generated PDFs
│   │   ├── download-pdf/route.ts # Download/delete PDFs
│   │   └── stats/route.ts      # Dashboard statistics
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles with CSS variables
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── sidebar.tsx             # Navigation sidebar
│   └── top-navbar.tsx          # Top navigation bar
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── types.ts                # TypeScript type definitions
│   ├── utils.ts                # Utility functions (cn)
│   ├── excel-parser.ts         # Excel file parsing service
│   └── pdf-generator.ts        # PDF generation service
└── generated/prisma/           # Generated Prisma client
```

## Features

### Event Management
- Create, edit, delete events
- Event name, date, and venue fields
- View event cards with metadata

### Attendance Generator
- Drag-and-drop Excel file upload (.xlsx, .xls)
- Event selection dropdown
- Participant data preview table
- Template image preview
- One-click PDF generation
- PDF preview in browser
- Download generated PDFs

### PDF Generation
- Uses template image as background overlay
- Draws participant data at precise coordinates
- Multi-page support (auto-paginates at 20 rows per page)
- Helvetica font with configurable coordinates

### Calibration Tool
- Upload template image
- Click to capture X,Y coordinates
- Copy coordinates to clipboard
- Visual coordinate mapping

### Generated PDFs
- Table view of all generated PDFs
- Download and delete functionality
- Event association and participant counts

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events |
| POST | `/api/events` | Create a new event |
| PUT | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event |
| POST | `/api/upload-excel` | Parse Excel file |
| POST | `/api/generate-pdf` | Generate attendance PDF |
| GET | `/api/generated-pdfs` | List generated PDFs |
| GET | `/api/download-pdf?id=` | Download a PDF |
| DELETE | `/api/download-pdf?id=` | Delete a PDF |
| GET | `/api/stats` | Dashboard statistics |

## Excel Format

The Excel file should contain these columns:

| S.No | Participant Name | Department | College | Email | Phone Number |
|------|-----------------|------------|---------|-------|--------------|
| 1 | John Doe | CSE | ABC College | john@email.com | 1234567890 |

Required columns: **Participant Name**
Optional columns: S.No, Department, College, Email, Phone Number

## Configuration

### PDF Coordinates

Default coordinates can be adjusted in the Settings page or in `src/lib/pdf-generator.ts`:

```typescript
const DEFAULT_COORDINATES = {
  startX_sno: 55,
  startX_name: 105,
  startX_dept: 310,
  startX_college: 420,
  startY: 520,
  rowHeight: 25,
  fontSize: 10,
};
```

Use the Calibration Tool at `/admin/calibration` to visually determine exact coordinates for your template.

## Security

- Server-side file type validation
- File size limits (10MB max)
- SQL injection protection via Prisma ORM
- Input sanitization and validation

## License

MIT
