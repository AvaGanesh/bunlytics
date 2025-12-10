# Bunlytics

Bunlytics is a lightweight analytics dashboard and SQL console built with [Bun](https://bun.sh), React, and SQLite. It provides a simple way to upload datasets, run SQL queries, and visualize data.

## Prerequisites

- [Bun](https://bun.sh) (v1.0.0 or later)

## Installation

### Backend

1. Install dependencies:
   ```bash
   bun install
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

## Running the Application

You will need two terminal windows to run the full application.

### 1. Start the Backend API

From the root directory:

```bash
bun run src/server.ts
```
The server will start on `http://localhost:3000`.

### 2. Start the Frontend Dev Server

From the `frontend` directory:

```bash
cd frontend
bun run dev
```
The frontend will typically run on `http://localhost:5173` (check the terminal output).

## Features

- **Authentication**: Secure user signup and login.
- **Datasets**: 
  - Upload CSV files to create new datasets.
  - Automatically infers schema and creates SQLite tables.
- **SQL Console**: 
  - Run arbitrary SQL `SELECT` queries against your datasets.
  - View results in a responsive grid.
  - Query history tracking.
- **Dashboards**: 
  - Create dashboards to organize your insights.
  - (Planned) Add visualization panels driven by SQL queries.
