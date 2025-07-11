import React, { useEffect, useState, useMemo, useCallback } from "react";

// const headerColor = "bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-900";
const headerColor = "bg-[#3F51B5] text-white";
const pendingheaderColor = "bg-[#E65100] text-white";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const Clients = () => {
  const [currentInterestData, setCurrentInterestData] = useState<any[]>([]);
  const [previousPendingData, setPreviousPendingData] = useState<any[]>([]);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedPendingRows, setSelectedPendingRows] = useState<number[]>([]);
  const [selectAllPending, setSelectAllPending] = useState(false);
  const [currentPageCurrent, setCurrentPageCurrent] = useState(1);
  const [currentPagePrevious, setCurrentPagePrevious] = useState(1);
  const [filterName, setFilterName] = useState("");
  const [filterPlace, setFilterPlace] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const ROWS_PER_PAGE = 10;

  // Fetch current interest data
  const fetchCurrentInterest = (selectedMonth: string) => {
    setLoadingCurrent(true);
    fetch(`/api/v1/currentinterestterm1?month=${selectedMonth}`)
      .then((res) => res.json())
      .then((rows) => {
        setCurrentInterestData(rows);
        setLoadingCurrent(false);
        setSelectedRows([]);
        setSelectAll(false);
      })
      .catch(() => setLoadingCurrent(false));
  };

  // Fetch previous pending data
  const fetchPreviousPending = (selectedMonth: string) => {
    setLoadingPrevious(true);
    fetch(`/api/v1/term1?month=${selectedMonth}`)
      .then((res) => res.json())
      .then((rows) => {
        setPreviousPendingData(rows);
        setLoadingPrevious(false);
        setSelectedPendingRows([]);
        setSelectAllPending(false);
      })
      .catch(() => setLoadingPrevious(false));
  };

  useEffect(() => {
    fetchCurrentInterest(month);
    fetchPreviousPending(month);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // const handleShow = () => {
  //   fetchCurrentInterest(month);
  //   fetchPreviousPending(month);
  // };

  // Checkbox logic
  const handleSelectRow = (idx: number) => {
    setSelectedRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      setSelectedRows(currentInterestData.map((_, idx) => idx));
      setSelectAll(true);
    }
  };

  // "Received" button logic
  const handleReceived = async () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // yyyy-mm-dd
    const inputMonth = month;

    const toInsert: any[] = [];
    const toUpdate: any[] = [];

    selectedRows.forEach((idx) => {
      const row = currentInterestData[idx];
      if (row.InterestStatus === "Not Received") {
        toInsert.push({
          InterestReceived: row.InterestAmount,
          InterestReceivedDate: todayStr,
          InterestMonth: inputMonth,
          Status: "Received",
          PrincipalID: row.PrincipalID,
        });
      } else if (row.InterestStatus === "Pending") {
        toUpdate.push({
          InterestReceived: row.InterestAmount,
          InterestReceivedDate: todayStr,
          InterestMonth: inputMonth,
          Status: "Received",
          InterestID: row.InterestID,
        });
      }
    });

    // API calls
    if (toInsert.length > 0) {
      await fetch("/api/v1/currentinterestterm1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toInsert),
      });
    }
    if (toUpdate.length > 0) {
      await fetch("/api/v1/currentinterestterm1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toUpdate),
      });
    }

    // Optionally, refresh data after operation
    fetchCurrentInterest(month);
    setSelectedRows([]);
    setSelectAll(false);
    setToast({ message: "Selected Rows Interest Updated", type: "success" });
  };

  // Checkbox logic for previous pending table
  const handleSelectPendingRow = (idx: number) => {
    setSelectedPendingRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllPending = () => {
    if (selectAllPending) {
      setSelectedPendingRows([]);
      setSelectAllPending(false);
    } else {
      setSelectedPendingRows(previousPendingData.map((_, idx) => idx));
      setSelectAllPending(true);
    }
  };

  // "Pendings Received" button logic
  const handlePendingReceived = async () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const toInsert: any[] = [];
    const toUpdate: any[] = [];

    selectedPendingRows.forEach((idx) => {
      const row = previousPendingData[idx];
      if (row.PendingStatus === "Not Received") {
        toInsert.push({
          InterestReceived: row.InterestAmount,
          InterestReceivedDate: todayStr,
          InterestMonth: row.InterestMonth, // Use row.InterestMonth here
          Status: "Received",
          PrincipalID: row.PrincipalID,
        });
      } else if (row.PendingStatus === "Pending") {
        toUpdate.push({
          InterestReceived: row.InterestAmount,
          InterestReceivedDate: todayStr,
          InterestMonth: row.InterestMonth, // Use row.InterestMonth here
          Status: "Received",
          InterestID: row.InterestID,
        });
      }
    });

    if (toInsert.length > 0) {
      await fetch("/api/v1/currentinterestterm1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toInsert),
      });
    }
    if (toUpdate.length > 0) {
      await fetch("/api/v1/currentinterestterm1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toUpdate),
      });
    }

    fetchPreviousPending(month);
    setSelectedPendingRows([]);
    setSelectAllPending(false);

    setToast({ message: "Selected Rows Interest Updated", type: "success" });
  };

  // Combine unique Place, Zone, and Status from both tables
  const placeOptions = useMemo(() => {
    const places = [
      ...currentInterestData.map((row) => row.Place),
      ...previousPendingData.map((row) => row.Place),
    ];
    return Array.from(new Set(places.filter(Boolean)));
  }, [currentInterestData, previousPendingData]);

  const zoneOptions = useMemo(() => {
    const zones = [
      ...currentInterestData.map((row) => row.Zone),
      ...previousPendingData.map((row) => row.Zone),
    ];
    return Array.from(new Set(zones.filter(Boolean)));
  }, [currentInterestData, previousPendingData]);

  const statusOptions = useMemo(() => {
    const statuses = [
      ...currentInterestData.map((row) => row.InterestStatus),
      ...previousPendingData.map((row) => row.PendingStatus),
    ];
    return Array.from(new Set(statuses.filter(Boolean)));
  }, [currentInterestData, previousPendingData]);

  // Filter logic for both tables
  const filterRow = (row: any, isCurrent: boolean) => {
    const statusField = isCurrent ? row.InterestStatus : row.PendingStatus;
    return (
      (filterName === "" ||
        (row.Name && row.Name.toLowerCase().includes(filterName.toLowerCase()))) &&
      (filterPlace === "" || row.Place === filterPlace) &&
      (filterZone === "" || row.Zone === filterZone) &&
      (filterStatus === "" || statusField === filterStatus)
    );
  };

  const filteredCurrentInterestData = currentInterestData.filter((row) =>
    filterRow(row, true)
  );
  const filteredPreviousPendingData = previousPendingData.filter((row) =>
    filterRow(row, false)
  );

  // Pagination logic (use filtered data)
  const currentInterestPageData = filteredCurrentInterestData.slice(
    (currentPageCurrent - 1) * ROWS_PER_PAGE,
    currentPageCurrent * ROWS_PER_PAGE
  );
  const previousPendingPageData = filteredPreviousPendingData.slice(
    (currentPagePrevious - 1) * ROWS_PER_PAGE,
    currentPagePrevious * ROWS_PER_PAGE
  );
  const totalCurrentPages = Math.ceil(filteredCurrentInterestData.length / ROWS_PER_PAGE) || 1;
  const totalPreviousPages = Math.ceil(filteredPreviousPendingData.length / ROWS_PER_PAGE) || 1;

  // Calculate totals for footers
  const totalCurrentMonthPendingInterest = filteredCurrentInterestData.reduce(
    (sum, row) => {
      // Remove currency symbol and commas, then parse
      const value = parseFloat(
        String(row.CurrentMonthPendingInterest).replace(/[^0-9.-]+/g, "")
      );
      return sum + (isNaN(value) ? 0 : value);
    },
    0
  );

  const totalCurrentInterestReceived = filteredCurrentInterestData =>
    filteredCurrentInterestData.reduce(
      (sum, row) => sum + (parseFloat(row.InterestReceived) || 0),
      0
    );

  const totalInterestReceived = filteredPreviousPendingData =>
    filteredPreviousPendingData.reduce(
      (sum, row) => sum + (parseFloat(row.InterestReceived) || 0),
      0
    );

  const totalPendingAmount = filteredPreviousPendingData =>
    filteredPreviousPendingData.reduce(
      (sum, row) => sum + (parseFloat(row.PendingAmount) || 0),
      0
    );

  // Pagination controls component
  const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => (
    <div className="flex justify-center items-center gap-2 my-4">
      <button
        className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        {"<<"}
      </button>
      <button
        className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {"<"}
      </button>
      <span className="px-2">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {">"}
      </button>
      <button
        className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        {">>"}
      </button>
    </div>
  );

  const handleDownloadMonthlyPendingPDF = useCallback(async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const now = new Date();
    const filename = `Monthly Pending Interests_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.pdf`;

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });

    // Calculate totals for footers
    const totalCurrentMonthPendingInterest = currentInterestData.reduce((sum, row) => {
        const value = parseFloat(String(row.CurrentMonthPendingInterest).replace(/[^0-9.-]+/g, ""));
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const totalCurrentInterestReceived = currentInterestData.reduce((sum, row) => {
        const value = parseFloat(String(row.InterestReceived).replace(/[^0-9.-]+/g, ""));
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const totalInterestReceived = previousPendingData.reduce((sum, row) => {
        const value = parseFloat(String(row.InterestReceived).replace(/[^0-9.-]+/g, ""));
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const totalPendingAmount = previousPendingData.reduce((sum, row) => {
        const value = parseFloat(String(row.PendingAmount).replace(/[^0-9.-]+/g, ""));
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    // --- Current Interest Table ---
    doc.text("Current Month Pending Interests", 14, 16);
    autoTable(doc, {
        head: [[
            "Name", "PrincipalAmount", "InterestAmount", "Place", "Zone", "Term", "StartDate", "InterestDate","InterestReceived", "PendingInterest", "Status"
        ]],
        body: currentInterestData.map(row => [
            row.Name,
            row.PrincipalAmount,
            row.InterestAmount,
            row.Place,
            row.Zone,
            row.Term,
            formatDateDMY(row.StartDate),
            formatDateDMY(row.InterestDate),
            row.InterestReceived,
            row.CurrentMonthPendingInterest
              ? Number(String(row.CurrentMonthPendingInterest).replace(/[^0-9.-]+/g, "")).toLocaleString("en-IN", { maximumFractionDigits: 0 })
              : "",
            row.InterestStatus
        ]),
        startY: 20,
        styles: { fontSize: 8 },
        theme: "grid",
        foot: [
            [
                { content: "Total", colSpan: 8, styles: { halign: "right" } },
                { content: `Rs.${totalCurrentInterestReceived.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, styles: { halign: "left" } },
                { content: `Rs.${totalCurrentMonthPendingInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, styles: { halign: "left" } },
                { content: "", styles: { halign: "left" } }
            ]
        ]
    });

    let nextY = doc.lastAutoTable.finalY + 10 || 30;

    // --- Previous Pending Table ---
    doc.text("Previous Months Pending Interests", 14, nextY);
    autoTable(doc, {
        head: [[
            "Name", "PrincipalAmount", "Place", "Zone", "Term", "StartDate", "InterestDate", "InterestMonth", "InterestAmount", "InterestReceived", "PendingAmount", "PendingStatus"
        ]],
        body: previousPendingData.map(row => [
            row.Name,
            row.PrincipalAmount,
            row.Place,
            row.Zone,
            row.Term,
            formatDateDMY(row.StartDate),
            formatDateDMY(row.InterestDate),
            row.InterestMonth,
            row.InterestAmount,
            row.InterestReceived,
            row.PendingAmount,
            row.PendingStatus
        ]),
        startY: nextY + 4,
        styles: { fontSize: 8 },
        theme: "grid",
        foot: [
            [
                { content: "Total", colSpan: 9, styles: { halign: "right" } },
                { content: `Rs.${totalInterestReceived.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, styles: { halign: "left" } },
                { content: `Rs.${totalPendingAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, styles: { halign: "left" } },
                { content: "", styles: { halign: "left" } }
            ]
        ]
    });

    doc.save(filename);
  }, [currentInterestData, previousPendingData]);

  const handleClearFilters = () => {
    setFilterName("");
    setFilterPlace("");
    setFilterZone("");
    setFilterStatus("");
    setCurrentPageCurrent(1);
    setCurrentPagePrevious(1);
  };

  // Helper to get month name and year from yyyy-mm
  function getMonthYearLabel(ym: string) {
    if (!ym) return "";
    const [year, month] = ym.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return `${date.toLocaleString("default", { month: "long" })} ${year}`;
  }

  // Format date string (YYYY-MM-DD or ISO) to DD-MM-YYYY
  function formatDateDMY(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // fallback if invalid
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return (
    <div
      className="p-6 min-h-screen"
      style={{
        background:
          "linear-gradient(120deg, #f0f4ff 0%, #e0e7ef 100%)",
      }}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4 items-end bg-white/90 rounded-xl shadow-lg p-4 border border-blue-200">
        <div>
          <label className="block text-blue-900 font-semibold mb-1">Name</label>
          <input
            type="text"
            className="border p-2 rounded w-40"
            placeholder="Search Name"
            value={filterName}
            onChange={e => {
              setFilterName(e.target.value);
              setCurrentPageCurrent(1);
              setCurrentPagePrevious(1);
            }}
          />
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1">Place</label>
          <select
            className="border p-2 rounded w-40"
            value={filterPlace}
            //onChange={e => setFilterPlace(e.target.value)}
            onChange={e => {
              setFilterPlace(e.target.value);
              setCurrentPageCurrent(1);
              setCurrentPagePrevious(1);
            }}
          >
            <option value="">All</option>
            {placeOptions.map((place) => (
              <option key={place} value={place}>{place}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1">Zone</label>
          <select
            className="border p-2 rounded w-40"
            value={filterZone}
            //onChange={e => setFilterZone(e.target.value)}
            onChange={e => {
              setFilterZone(e.target.value);
              setCurrentPageCurrent(1);
              setCurrentPagePrevious(1);
            }}
          >
            <option value="">All</option>
            {zoneOptions.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1">Interest Status</label>
          <select
            className="border p-2 rounded w-40"
            value={filterStatus}
            //onChange={e => setFilterStatus(e.target.value)}
            onChange={e => {
              setFilterStatus(e.target.value);
              setCurrentPageCurrent(1);
              setCurrentPagePrevious(1);
            }}
          >
            <option value="">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        {/* Top Centered Month Picker */}
        <div >
          <label className="block text-blue-900 font-semibold mb-1">
            Interest Status Month
          </label>
          <input
            type="month"
            className="border p-2 rounded mr-2"
            value={month}
            // onChange={(e) => setMonth(e.target.value)}
            onChange={e => {
              setMonth(e.target.value);
              fetchCurrentInterest(e.target.value);
              fetchPreviousPending(e.target.value);
              setCurrentPageCurrent(1);
              setCurrentPagePrevious(1);
            }}
            max="9999-12"
          />
          {/* <button
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded shadow hover:from-blue-600 hover:to-indigo-600 transition"
            onClick={handleShow}
          >
            Show
          </button> */}
        </div>
        <div className="flex items-end">
          <button
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded shadow hover:from-blue-600 hover:to-indigo-600 transition"
            onClick={handleClearFilters}
            type="button"
          >
            Clear Filters
          </button>
        </div>
        <div className="flex justify-end gap-4">
          <button
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded shadow hover:from-blue-600 hover:to-indigo-600 transition"
            onClick={handleDownloadMonthlyPendingPDF}
          >
            Download PDF
          </button>
      </div>
      </div>

      

      <h2 className="text-2xl font-bold mb-6 text-blue-800 tracking-wide">
        {getMonthYearLabel(month)} pendings
      </h2>
      <div
        className="overflow-x-auto rounded-xl shadow-lg border border-blue-200 mb-4"
        style={{ background: "#C5CAE9" }}
      >
        {loadingCurrent ? (
          <div className="p-8 text-center text-blue-700">Loading...</div>
        ) : (
          <>
            <table className="min-w-full border-collapse">
              <thead>
                <tr className={headerColor}>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    Name
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    PrincipalAmount
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    Place
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    Zone
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    Term
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    StartDate
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    InterestDate
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    InterestAmount
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    InterestReceived
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    PendingInterest
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    InterestStatus
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px] text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentInterestPageData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-gray-500">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  currentInterestPageData.map((row, idx) => {
                    const globalIdx = (currentPageCurrent - 1) * ROWS_PER_PAGE + idx;
                    const isSelected = selectedRows.includes(globalIdx);
                    return (
                      <tr
                        key={globalIdx}
                        className={`hover:bg-yellow-50 ${isSelected ? "bg-yellow-50" : ""}`}
                      >
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.Name}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.PrincipalAmount}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.Place}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.Zone}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.Term}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {formatDateDMY(row.StartDate)}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {formatDateDMY(row.InterestDate)}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.InterestAmount}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.InterestReceived}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.CurrentMonthPendingInterest}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.InterestStatus}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px] text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(globalIdx)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={8} className="text-right font-semibold px-4 py-2 border-t border-blue-200">
                    Total:
                  </td>
                  <td className="font-semibold px-4 py-2 border-t border-blue-200">
                    {totalInterestReceived(filteredCurrentInterestData).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </td>
                  <td className="font-semibold px-4 py-2 border-t border-blue-200">
                    {totalCurrentMonthPendingInterest.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </td>
                  <td colSpan={2} className="border-t border-blue-200"></td>
                </tr>
              </tfoot>
            </table>
            <div className="flex justify-end my-4">
              <button
                className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition disabled:opacity-50"
                disabled={selectedRows.length === 0}
                onClick={handleReceived}
              >
                Received
              </button>
            </div>
            <Pagination
                    currentPage={currentPageCurrent}
                    totalPages={totalCurrentPages}
                    onPageChange={setCurrentPageCurrent}
                  />
          </>
        )}
      </div>
      

      {/* <h2 className="text-2xl font-bold mb-6 text-blue-800 tracking-wide"> */}
      <h2 className="text-2xl font-bold mb-6 tracking-wide" style={{ color: "#E65100" }}>
        Previous Months Pendings
      </h2>
      <div
        className="overflow-x-auto rounded-xl shadow-lg border border-blue-200"
        style={{ background: "#FFF3E0" }}
      >
        {loadingPrevious ? (
          <div className="p-8 text-center text-blue-700">Loading...</div>
        ) : (
          <>
            <table className="min-w-full border-collapse">
              <thead>
                <tr className={pendingheaderColor}>
                  {/* <th className="px-4 py-2 border-b border-blue-200 border border-[0.5px]">
                    PrincipalID
                  </th> */}
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    Name
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    PrincipalAmount
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    Place
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    Zone
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    Term
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    StartDate
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    InterestDate
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    InterestMonth
                  </th>
                  {/* <th className="px-4 py-2 border-b border-blue-200 border border-[0.5px]">
                    InterestID
                  </th>
                  <th className="px-4 py-2 border-b border-blue-200 border border-[0.5px]">
                    InterestStatus
                  </th> */}
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    InterestAmount
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    InterestReceived
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    PendingInterest
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">
                    PendingStatus
                  </th>
                  <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px] text-center">
                    <input
                      type="checkbox"
                      checked={selectAllPending}
                      onChange={handleSelectAllPending}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {previousPendingPageData.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="text-center py-4 text-gray-500">
                      No previous pending data found.
                    </td>
                  </tr>
                ) : (
                  previousPendingPageData.map((row, idx) => {
                    const globalIdx = (currentPagePrevious - 1) * ROWS_PER_PAGE + idx;
                    const isSelected = selectedPendingRows.includes(globalIdx);
                    return (
                      <tr
                        key={globalIdx}
                        className={`hover:bg-blue-50 ${isSelected ? "bg-blue-50" : ""}`}
                      >
                        {/* <td className="px-4 py-2 border border-[0.5px]">
                          {row.PrincipalID}
                        </td> */}
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.Name}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.PrincipalAmount}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.Place}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.Zone}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.Term}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {formatDateDMY(row.StartDate)}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {formatDateDMY(row.InterestDate)}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.InterestMonth}
                        </td>
                        {/* <td className="px-4 py-2 border border-[0.5px]">
                          {row.InterestID}
                        </td>
                        <td className="px-4 py-2 border border-[0.5px]">
                          {row.InterestStatus}
                        </td> */}
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.InterestAmount}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.InterestReceived}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.PendingAmount}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                          {row.PendingStatus}
                        </td>
                        <td className="px-4 py-2 border-indigo-300 border border-[0.5px] text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectPendingRow(globalIdx)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={9} className="text-right font-semibold px-4 py-2 border-t border-blue-200">
                    Total:
                  </td>
                  <td className="font-semibold px-4 py-2 border-t border-blue-200">
                    {totalInterestReceived(filteredPreviousPendingData).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </td>
                  <td className="font-semibold px-4 py-2 border-t border-blue-200">
                    {totalPendingAmount(filteredPreviousPendingData).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </td>
                  <td className="border-t border-blue-200"></td>
                </tr>
              </tfoot>
            </table>
            <div className="flex justify-end my-4">
              <button
                className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition disabled:opacity-50"
                disabled={selectedPendingRows.length === 0}
                onClick={handlePendingReceived}
              >
                Pendings Received
              </button>
            </div>
            <Pagination
              currentPage={currentPagePrevious}
              totalPages={totalPreviousPages}
              onPageChange={setCurrentPagePrevious}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Clients;