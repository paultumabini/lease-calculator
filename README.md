# Vehicle Lease Calculator

A lightweight vanilla JavaScript lease worksheet for vehicle financing scenarios.

Live demo: [https://vehicle-lease-calculator.vercel.app/](https://vehicle-lease-calculator.vercel.app/)

## Deployment

Production is hosted on **Vercel**. When the project is linked to this GitHub repository, merges into `main` update the live demo URL above.

## Overview

This project provides an interactive lease calculator that helps estimate:

- capitalized cost and net lease amount
- residual and adjusted residual values
- lease payment by frequency (monthly, biweekly, weekly)
- tax-inclusive payment output and lease-end totals

## Features

- Real-time calculation updates as users type/select values
- Currency-style numeric formatting on focus/blur
- Dynamic dropdowns (Make -> available annual KM options)
- Payment readiness hints when required fields are missing
- In-place reset that clears all fields without page reload

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)
- Bootstrap (styling utilities + tooltip behavior)

## Browser support

Use a current evergreen browser (Chrome, Edge, Firefox, or Safari). The app relies on ES modules (`import` / `export`), which require a local or hosted HTTP origin—not `file://` URLs.

## Project Structure

```text
lease_calculator/
├─ index.html
├─ src/
│  ├─ css/
│  │  └─ style.css
│  ├─ js/
│  │  ├─ dataReference.js
│  │  ├─ main.js
│  │  ├─ renderDropdowns.js
│  │  └─ renderCalculation.js
│  └─ bootstrap/
└─ README.md
```

## Getting Started

### 1) Clone

```bash
git clone <your-repository-url>
cd lease_calculator
```

### 2) Run locally

Because this app uses ES modules, serve it with a local HTTP server (instead of opening `index.html` directly from disk).

Example with VS Code Live Server, or:

```bash
# Python 3
python -m http.server 5500
```

Then open:

- [http://localhost:5500](http://localhost:5500)

## Usage

1. Select a make, term, and payment frequency.
2. Enter key lease inputs (MSRP, residual MSRP, residual %, rate, etc.).
3. Review calculated fields and payment output as values update in real time.
4. Use `RESET` to clear all inputs and outputs back to an empty state.

## Notes

- Annual KM options depend on the selected make.
- Payment output is intentionally gated until required fields are provided.

## License

Add your preferred license here (for example: MIT).
