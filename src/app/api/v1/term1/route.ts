import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/v1/term1
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
    MonthGenerator AS (
      SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
      SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL
      SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
    ),
    InterestMonthsExpanded AS (
      SELECT 
        b.PrincipalID,
        b.Name,
        b.Place,
        b.Zone,
        b.Term,
        b.StartDate,
        b.InterestDate,
        b.PrincipalAmount,
        b.InterestAmount,
        strftime('%Y-%m', date(strftime('%Y-%m-01', b.StartDate), '+' || n || ' months')) AS InterestMonth
      FROM InterestDateCalc b
      CROSS JOIN MonthGenerator
      WHERE date(strftime('%Y-%m-01', b.StartDate), '+' || n || ' months') < b.InputMonthStart
    ),
    DetailedPending AS (
      SELECT 
        ime.PrincipalID,
        ime.Name,
        ime.Place,
        ime.Zone,
        ime.Term,
        ime.StartDate,
        ime.InterestDate,
        ime.PrincipalAmount,
        ime.InterestAmount,
        ime.InterestMonth,
        i.InterestID,
        i.Status AS InterestStatus,
        IFNULL(i.InterestReceived, 0) AS InterestReceived,
        CASE
          WHEN i.InterestID IS NOT NULL AND i.Status = 'Pending'
          THEN ime.InterestAmount - i.InterestReceived
          WHEN i.InterestID IS NULL
          THEN ime.InterestAmount
          ELSE NULL
        END AS PendingAmount,
        CASE
          WHEN i.InterestID IS NOT NULL AND i.Status = 'Pending'
          THEN 'Pending'
          WHEN i.InterestID IS NULL
          THEN 'Not Received'
          ELSE NULL
        END AS PendingStatus
      FROM InterestMonthsExpanded ime
      LEFT JOIN Interest i 
        ON i.PrincipalID = ime.PrincipalID
        AND strftime('%Y-%m', i.InterestMonth) = ime.InterestMonth
      WHERE i.Status IS NULL OR i.Status = 'Pending'
    )
    SELECT
      PrincipalID,
      Name,
      PrincipalAmount,
      Place,
      Zone,
      Term,
      DATE(StartDate) AS StartDate,
      DATE(InterestDate) AS InterestDate,
      InterestMonth,
      InterestID,
      InterestStatus,
      InterestAmount,
      InterestReceived,
      PendingAmount,
      PendingStatus
    FROM DetailedPending
    ORDER BY PrincipalID, InterestMonth;
  `;

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  return rows;
}