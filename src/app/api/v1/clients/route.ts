import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/v1/clients
export async function GET(req: NextRequest) {
  try {
    // Fetch all clients
    const clients = db.prepare(`SELECT * FROM Client order by ClientID desc`).all();

    // Fetch all principals
    const principals = db.prepare(`SELECT * FROM Principal`).all();

    // Fetch all interests
    const interests = db.prepare(`SELECT * FROM Interest order by InterestMonth asc`).all();

    // Attach interests to principals
    const principalMap = principals.map((principal: any) => ({
      ...principal,
      interests: interests.filter((i: any) => i.PrincipalID === principal.PrincipalID),
    }));

    // Attach principals to clients
    const clientData = clients.map((client: any) => ({
      ...client,
      principals: principalMap.filter((p: any) => p.ClientID === client.ClientID),
    }));

    return NextResponse.json({ clients: clientData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data', details: String(error) }, { status: 500 });
  }
}

// POST /api/v1/clients
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { Name, MobileNumber, Place, Address, Zone, Status } = body;

    if (
      !Name ||
      !MobileNumber ||
      !Place ||
      //!Address ||
      !Zone ||
      !Status
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const stmt = db.prepare(
      `INSERT INTO Client (Name, MobileNumber, Place, Address, Zone, Status)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(Name, MobileNumber, Place, Address, Zone, Status);

    // Return the newly created client
    const newClient = db.prepare(`SELECT * FROM Client WHERE ClientID = ?`).get(info.lastInsertRowid);

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to insert client', details: String(error) }, { status: 500 });
  }
}

// PUT /api/v1/clients
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { ClientID, Name, MobileNumber, Place, Address, Zone, Status } = body;

    if (
      !ClientID ||
      !Name ||
      !MobileNumber ||
      !Place ||
      //!Address ||
      !Zone ||
      !Status
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const stmt = db.prepare(
      `UPDATE Client
       SET Name = ?, MobileNumber = ?, Place = ?, Address = ?, Zone = ?, Status = ?
       WHERE ClientID = ?`
    );
    const info = stmt.run(Name, MobileNumber, Place, Address, Zone, Status, ClientID);

    if (info.changes === 0) {
      return NextResponse.json({ error: "Client not found or no changes made" }, { status: 404 });
    }

    // Return the updated client
    const updatedClient = db.prepare(`SELECT * FROM Client WHERE ClientID = ?`).get(ClientID);

    return NextResponse.json({ client: updatedClient }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update client', details: String(error) }, { status: 500 });
  }
}

// DELETE /api/v1/clients
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { ClientID } = body;

    if (!ClientID) {
      return NextResponse.json({ error: "ClientID is required" }, { status: 400 });
    }

    const stmt = db.prepare(`DELETE FROM Client WHERE ClientID = ?`);
    const info = stmt.run(ClientID);

    if (info.changes === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete client', details: String(error) }, { status: 500 });
  }
}

