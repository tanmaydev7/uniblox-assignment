# Setup Guide

This guide will help you set up the Uniblox Assignment project on your local machine.

## Prerequisites

- Node.js (v21.5.0.)

## Environment Variables Setup

1. At the root folder, look at `.env.example` and create a `.env` file
2. Copy the variables from `.env.example` and add their respective values

## Backend Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm i
   ```

3. Run database migrations:
   ```bash
   npx drizzle-kit migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will be running on `http://localhost:8000` (or the port specified in your `.env` file).

## Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm i
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be running on its default port (check the terminal output for the exact URL).

