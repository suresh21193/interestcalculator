import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// POST /api/v1/principal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { PrincipalAmount, StartDate, Term, InterestAmount, Remarks, Status, /* ClosedDate, */ ClientID } = body;

    if (
      PrincipalAmount === undefined ||
      !StartDate ||
      Term === undefined ||
      InterestAmount === undefined ||
      Remarks === undefined ||
      !Status ||
      // ClosedDate === undefined || // Removed ClosedDate from required fields
      !ClientID
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const stmt = db.prepare(
      `INSERT INTO Principal (PrincipalAmount, StartDate, Term, InterestAmount, Remarks, Status, ClientID)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      PrincipalAmount,
      StartDate,
      Term,
      InterestAmount,
      Remarks,
      Status,
      ClientID
    );

    // Return the newly created principal
    const newPrincipal = db.prepare(`SELECT * FROM Principal WHERE PrincipalID = ?`).get(info.lastInsertRowid);

    return NextResponse.json({ principal: newPrincipal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to insert principal', details: String(error) }, { status: 500 });
  }
}

// PUT /api/v1/principal
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { PrincipalID, PrincipalAmount, StartDate, Term, InterestAmount, Remarks, Status, ClosedDate /*, ClientID*/ } = body;

    if (
      !PrincipalID ||
      PrincipalAmount === undefined ||
      !StartDate ||
      Term === undefined ||
      InterestAmount === undefined ||
      Remarks === undefined ||
      !Status ||
      ClosedDate === undefined
      // !ClientID // Removed ClientID from required fields
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const stmt = db.prepare(
      `UPDATE Principal
       SET PrincipalAmount = ?, StartDate = ?, Term = ?, InterestAmount = ?, Remarks = ?, Status = ?, ClosedDate = ?
       WHERE PrincipalID = ?`
    );
    const info = stmt.run(
      PrincipalAmount,
      StartDate,
      Term,
      InterestAmount,
      Remarks,
      Status,
      ClosedDate,
      PrincipalID
    );

    if (info.changes === 0) {
      return NextResponse.json({ error: "Principal not found or no changes made" }, { status: 404 });
    }

    // Return the updated principal
    const updatedPrincipal = db.prepare(`SELECT * FROM Principal WHERE PrincipalID = ?`).get(PrincipalID);

    return NextResponse.json({ principal: updatedPrincipal }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update principal', details: String(error) }, { status: 500 });
  }
}

// DELETE /api/v1/principal
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { PrincipalID } = body;

    if (!PrincipalID) {
      return NextResponse.json({ error: "PrincipalID is required" }, { status: 400 });
    }

    const stmt = db.prepare(`DELETE FROM Principal WHERE PrincipalID = ?`);
    const info = stmt.run(PrincipalID);

    if (info.changes === 0) {
      return NextResponse.json({ error: "Principal not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Principal deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete principal', details: String(error) }, { status: 500 });
  }
}