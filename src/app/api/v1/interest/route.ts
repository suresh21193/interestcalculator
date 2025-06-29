import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// POST /api/v1/interest
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { InterestReceived, InterestReceivedDate, InterestMonth, Status, ...rest } = body;

    if (
      InterestReceived === undefined ||
      !InterestReceivedDate ||
      !Status
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (InterestMonth && /^\d{4}-\d{2}$/.test(InterestMonth)) {
      InterestMonth = InterestMonth + '-01';
    }

    const stmt = db.prepare(
      `INSERT INTO Interest (InterestReceived, InterestReceivedDate, InterestMonth, Status, PrincipalID)
       VALUES (?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      InterestReceived,
      InterestReceivedDate,
      InterestMonth,
      Status,
      body.PrincipalID
    );

    // Return the newly created interest
    const newInterest = db.prepare(`SELECT * FROM Interest WHERE InterestID = ?`).get(info.lastInsertRowid);

    return NextResponse.json({ interest: newInterest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to insert interest', details: String(error) }, { status: 500 });
  }
}

// PUT /api/v1/interest
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let { InterestID, InterestReceived, InterestReceivedDate, InterestMonth, Status, ...rest } = body;

    if (
      !InterestID ||
      InterestReceived === undefined ||
      !InterestReceivedDate ||
      !Status
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (InterestMonth && /^\d{4}-\d{2}$/.test(InterestMonth)) {
      InterestMonth = InterestMonth + '-01';
    }

    const stmt = db.prepare(
      `UPDATE Interest
       SET InterestReceived = ?, InterestReceivedDate = ?, InterestMonth = ?, Status = ?
       WHERE InterestID = ?`
    );
    const info = stmt.run(
      InterestReceived,
      InterestReceivedDate,
      InterestMonth,
      Status,
      InterestID
    );

    if (info.changes === 0) {
      return NextResponse.json({ error: "Interest not found or no changes made" }, { status: 404 });
    }

    // Return the updated interest
    const updatedInterest = db.prepare(`SELECT * FROM Interest WHERE InterestID = ?`).get(InterestID);

    return NextResponse.json({ interest: updatedInterest }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update interest', details: String(error) }, { status: 500 });
  }
}

// DELETE /api/v1/interest
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { InterestID } = body;

    if (!InterestID) {
      return NextResponse.json({ error: "InterestID is required" }, { status: 400 });
    }

    const stmt = db.prepare(`DELETE FROM Interest WHERE InterestID = ?`);
    const info = stmt.run(InterestID);

    if (info.changes === 0) {
      return NextResponse.json({ error: "Interest not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Interest deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete interest', details: String(error) }, { status: 500 });
  }
}