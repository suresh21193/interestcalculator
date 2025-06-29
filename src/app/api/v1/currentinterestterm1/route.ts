import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/v1/currentinterestterm1
// This endpoint retrieves the pending interest report for Term 1 loans
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '2025-06';

    const report = await getPendingInterestReport(month);

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data', details: String(error) }, { status: 500 });
  }
}

export function getPendingInterestReport(inputMonth: string = '2025-04') {
  const params = [inputMonth, inputMonth, inputMonth];
  const query = `
    WITH
    InputMonth AS (
      SELECT 
        ? AS InputMonthStr,
        DATE(? || '-01') AS InputMonthStart,
        DATE(? || '-01', '+1 month', '-1 day') AS InputMonthEnd
    ),
    BaseData AS (
        SELECT 
            c.Name,
            c.Place,
            c.Zone,
            p.PrincipalID,
            p.PrincipalAmount,
            p.InterestAmount,
            p.StartDate,
            p.Term,
            strftime('%d', p.StartDate) AS StartDay,
            im.InputMonthStr,
            im.InputMonthStart,
            im.InputMonthEnd
        FROM Principal p
        JOIN Client c ON c.ClientID = p.ClientID
        JOIN InputMonth im
        WHERE p.Status != 'Closed' AND p.Term = 1 AND c.Status='Open'
        ),
        InterestDateCalc AS (
        SELECT *,
            CASE 
            WHEN CAST(StartDay AS INTEGER) > CAST(strftime('%d', InputMonthEnd) AS INTEGER)
            THEN InputMonthEnd
            ELSE DATE(InputMonthStr || '-' || StartDay)
            END AS InterestDate
        FROM BaseData
        ),
        CurrentMonthPending AS (
        SELECT 
            p.PrincipalID,
            CASE 
            WHEN i.InterestID IS NULL THEN p.InterestAmount
            WHEN i.Status = 'Received' THEN 0
            WHEN i.Status = 'Pending' THEN p.InterestAmount - i.InterestReceived
            ELSE p.InterestAmount
            END AS CurrentMonthPendingInterest,
            i.Status AS InterestStatus,
            i.InterestID,
            i.InterestReceived
        FROM Principal p
        JOIN InputMonth im
        LEFT JOIN Interest i 
            ON i.PrincipalID = p.PrincipalID 
            AND strftime('%Y-%m', i.InterestMonth) = im.InputMonthStr
        WHERE p.Status != 'Closed' AND p.Term = 1
        )

        SELECT
        idc.Name,
        idc.PrincipalID,
        idc.PrincipalAmount,
        idc.InterestAmount,
        idc.Place,
        idc.Zone,
        idc.Term,
        DATE(idc.StartDate) AS StartDate,
        DATE(idc.InterestDate) AS InterestDate,
        printf('₹%.2f', cmp.CurrentMonthPendingInterest) AS CurrentMonthPendingInterest,
        COALESCE(cmp.InterestStatus, 'Not Received') AS InterestStatus,
        cmp.InterestID,
        cmp.InterestReceived AS InterestReceived
        FROM InterestDateCalc idc
        JOIN CurrentMonthPending cmp ON cmp.PrincipalID = idc.PrincipalID
        WHERE cmp.CurrentMonthPendingInterest > 0
        AND idc.InputMonthStr >= strftime('%Y-%m', idc.StartDate)
        ORDER BY idc.PrincipalID;
        `;

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  return rows;
}

// POST /api/v1/currentinterestterm1
// This endpoint allows inserting interest records
export async function POST(req: NextRequest) {
  try {
    const interests = await req.json(); // expects an array of interest objects
    const stmt = db.prepare(
      `INSERT INTO Interest (InterestReceived, InterestReceivedDate, InterestMonth, Status, PrincipalID)
       VALUES (?, ?, ?, ?, ?)`
    );
    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        let { InterestReceived, InterestReceivedDate, InterestMonth, Status, PrincipalID } = row;
        if (InterestMonth && /^\d{4}-\d{2}$/.test(InterestMonth)) {
          InterestMonth = InterestMonth + '-01';
        }
        stmt.run(
          InterestReceived,
          InterestReceivedDate,
          InterestMonth,
          Status,
          PrincipalID
        );
      }
    });
    insertMany(interests);
    return NextResponse.json({ message: "Inserted successfully" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/v1/currentinterestterm1
// This endpoint allows updating interest records
export async function PUT(req: NextRequest) {
  try {
    const interests = await req.json(); // expects an array of interest objects
    const stmt = db.prepare(
      `UPDATE Interest
       SET InterestReceived = ?, InterestReceivedDate = ?, InterestMonth = ?, Status = ?
       WHERE InterestID = ?`
    );
    const updateMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        let { InterestReceived, InterestReceivedDate, InterestMonth, Status, InterestID } = row;
        if (InterestMonth && /^\d{4}-\d{2}$/.test(InterestMonth)) {
          InterestMonth = InterestMonth + '-01';
        }
        stmt.run(
          InterestReceived,
          InterestReceivedDate,
          InterestMonth,
          Status,
          InterestID
        );
      }
    });
    updateMany(interests);
    return NextResponse.json({ message: "Updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

