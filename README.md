# AttendPDF — Template Calibration Tool

A visual calibration tool for positioning attendance sheet tables onto custom PDF templates. Built with Next.js 16, React 19, Tailwind CSS 4, and Puppeteer-core.

## Features

- **Visual Canvas** — drag and resize a table overlay on an A4 canvas with grid lines and rulers
- **Default Template** — uses `attendance_template.png` as the background with table positioning
- **Custom Templates** — upload any PNG/JPG template and position the table on it
- **Excel Upload** — parse `.xlsx`/`.xls` files to preview real participant data
- **PDF Generation** — generates multi-page A4 PDFs with exact table placement via Puppeteer
- **Config Export/Import** — save and load calibration coordinates as JSON

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── public/
│   ├── attendance_template.png   # Default PDF template background
│   └── sbg_logo.svg              # Watermark logo
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (fonts, metadata)
│   │   ├── globals.css           # Tailwind theme, number input styles
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Pass-through layout
│   │   │   └── page.tsx          # Calibration tool (main UI)
│   │   └── api/
│   │       ├── upload-excel/     # POST — parse Excel → Participant[]
│   │       └── calibration-preview/  # POST — generate preview PDF
│   ├── components/ui/            # shadcn/ui (button, input, label)
│   └── lib/
│       ├── types.ts              # Participant, TemplateConfig interfaces
│       ├── utils.ts              # cn() class merge utility
│       ├── excel-parser.ts       # Excel buffer → Participant[]
│       ├── html-template.ts      # HTML builders for PDF pages
│       └── pdf-generator.ts      # Puppeteer PDF generation
```

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS 4**
- **Puppeteer-core** (Chrome-based PDF generation)
- **xlsx** (Excel parsing)
- **react-dropzone** (file uploads)
- **shadcn/ui** (UI components)
