"use client";
import React, {useEffect, useState, useRef} from "react";
import OfficeExpenseRow from "@/components/OfficeExpenseRow/OfficeExpenseRow";
import Modal from "@/components/Modal/Modal";
import ClipLoader from "react-spinners/ClipLoader";
import {Input} from "@headlessui/react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker"; // 👈 CHANGED: Import DatePicker
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OfficeExpense {
    officeexpenseid: number;
    name: string;
    cost: number;
    dateofexpense: string;
    remarks: string;
}

interface Pagination {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface OfficeExpensesResponse {
    expenses: OfficeExpense[];
    pagination: Pagination;
}

const OfficeExpenses = () => {
    const [expenses, setExpenses] = useState<OfficeExpense[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(10);
    const [search, setSearch] = useState<string>("");
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({
        name: "",
        cost: "",
        dateofexpense: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).replace(",", ""),
        remarks: "",
    });
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const API_BASE_URL = "http://localhost:3000";

    const [isAddExpenseFormValid, setIsAddExpenseFormValid] = useState(false);

    //date filter
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [startDate, endDate] = dateRange;

    const totalCost = expenses.reduce((sum, expense) => sum + expense.cost, 0);

    //download
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text("Office Expenses Report", 14, 15);

        // Add filter details if present
        const filters: string[] = [];
        if (search) filters.push(`Search: ${search}`);
        if (startDate && endDate) {
            const formattedStart = startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            const formattedEnd = endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            filters.push(`Date Range: ${formattedStart} - ${formattedEnd}`);
        }

        if (filters.length > 0) {
            doc.text("Filters:", 14, 23);
            filters.forEach((line, i) => {
                doc.text(line, 20, 30 + i * 7);  // Indent filter lines under "Filters:"
            });
        }

        const tableStartY = filters.length > 0 ? 30 + filters.length * 7 + 5 : 25;

        const tableColumn = ["Name", "Amount", "Date of expense", "Remarks"];
        const tableRows = expenses.map(exp => [
            exp.name,
            `Rs. ${exp.cost}`,
            exp.dateofexpense,
            exp.remarks
        ]);

        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.cost), 0);

        tableRows.push([
            { content: "Total", colSpan: 1, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: `Rs. ${total.toFixed(2)}`, colSpan: 1, styles: { fontStyle: 'bold' } },
            "", ""
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: tableStartY,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] },
            didParseCell: (data) => {
                // Check if the current row is the total row
                if (data.row.index === tableRows.length - 1) {
                    // Change the background color for the total row
                    data.cell.styles.fillColor = [220, 220, 220]; // Light grey background
                }
            }
        });

        doc.save("Office_Expenses_Report.pdf");
    };


    useEffect(() => {
        setIsAddExpenseFormValid(
            !!newExpense.name &&
            !!Number(newExpense.cost) &&
            !!newExpense.dateofexpense
        );
    }, [newExpense]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {

            fetchExpenses();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [page, shouldRefresh, dateRange]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {

            fetchExpenses();
        }, 2000);

        return () => clearTimeout(delayDebounce);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const fetchExpenses = async () => {
        try {
            setIsLoading(true);

            //formatting the date to "2025-04-16" in filters
            const formatDate = (date: Date | null) => {
                if (!date) return "";

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");

                return `${year}-${month}-${day}`; // e.g., "2025-04-16"
            };

            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);

            const response = await fetch(
                `/api/v1/officeexpensesget?page=${page}&limit=${limit}&search=${search}` +
                (formattedStartDate ? `&startDate=${formattedStartDate}` : "") +
                (formattedEndDate ? `&endDate=${formattedEndDate}` : "")
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: OfficeExpensesResponse = await response.json();
            setExpenses(data.expenses);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            console.error("Error fetching Office expenses:", err);
            setError("Failed to load Office expenses. Please try again later.");
        } finally {
            setIsLoading(false);

        }
    };
    // Function to Add New Expense
    const handleAddExpense = async () => {
        setIsAdding(true);
        setAddError(null);

        try {
            setIsLoading(true);
            const response = await fetch("/api/v1/officeexpenses", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: newExpense.name,
                    cost: parseFloat(newExpense.cost),
                    dateofexpense: newExpense.dateofexpense,
                    remarks: newExpense.remarks,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setExpenses((prev) => [...prev, data.expense]); // Add new expense to the list
            toast.success("office expense added successfully");
            setIsModalOpen(false); // Close modal
            setNewExpense({
                name: "",
                cost: "",
                dateofexpense: new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }).replace(",", ""),
                remarks: ""
            }); // Reset form
        } catch (err) {
            console.error("Error adding expense:", err);
            setAddError("Failed to add expense. Please try again.");
        } finally {
            setIsAdding(false);
            refreshExpenses();
        }
    };

    const refreshExpenses = () => {
        setShouldRefresh(prevShouldRefresh => !prevShouldRefresh);
    };

    return (
        <div>{isLoading ? (<div className="fixed inset-0 flex justify-center items-center bg-white bg-opacity-75 z-50">
            <ClipLoader size={75} color={"#4A90E2"} loading={isLoading}/>
        </div>) : (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search expenses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        /*className="w-full sm:flex-1 px-4 py-2 border rounded shadow-sm"*/
                        className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    />

                    <div className="w-full sm:flex-1">
                        <DatePicker
                            selectsRange
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update: [Date | null, Date | null]) => {
                                setDateRange(update);
                                setPage(1); // reset page on filter change
                            }}
                            isClearable
                            placeholderText="Filter by date range"
                            dateFormat="dd MMM yyyy"   // ✅ SHOW date as "19 Apr 2025"
                            /*className="w-full px-4 py-2 border rounded"*/
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800" // 🔵 Updated same as input field
                        />
                    </div>
                    <div className="flex justify-end items-center gap-4 sm:w-auto">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 1v12h10V4H5zm5 9a1 1 0 001-1V8h2l-3-3-3 3h2v4a1 1 0 001 1z" />
                            </svg>
                            Download PDF
                        </button>
                    </div>
                </div>

                {expenses.length === 0 ? (
                    <p className="text-gray-500">No expenses found.</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Expense Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date of Expense</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Remarks</th>

                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.map((expense) => (
                                <OfficeExpenseRow key={expense.officeexpenseid} expense={expense} refreshExpenses={() => {
                                    console.log("Refresh expense...");
                                    refreshExpenses();
                                }}/>
                            ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                                <tr>
                                    <td className="px-6 py-3 text-right font-semibold" colSpan={1}>Total:</td>
                                    <td className="px-6 py-3 font-semibold">₹ {totalCost}</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {!isLoading && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => {
                                setIsModalOpen(true)
                            }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4
                    rounded-md transition-colors cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            Add Expense
                        </button>
                    </div>
                )}

                {pagination && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 cursor-pointer"
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={!pagination.hasPrev}
                        >
                            Previous
                        </button>
                        <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 cursor-pointer"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={!pagination.hasNext}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <h2 className="text-xl font-bold mb-4">Add Expenses</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Name</label>
                            <Input
                                type="text"
                                placeholder="ExpenseName"
                                value={newExpense.name}
                                onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newExpense.name.trim() && (
                                <p className="text-red-500 text-sm mt-1">Name is required</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <Input
                                type="text"
                                value={newExpense.cost}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, "");
                                    setNewExpense({ ...newExpense, cost: numericValue });
                                }}
                                className="mb-2 w-full px-4 py-2 border rounded"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newExpense.cost.trim() && (
                                <p className="text-red-500 text-sm mt-1">Amount is required</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Expense</label>
                            <DatePicker
                                selected={newExpense.dateofexpense ? new Date(newExpense.dateofexpense) : new Date()}
                                onChange={(date: Date | null) => {
                                    if (date) {
                                        setNewExpense({
                                            ...newExpense,
                                            dateofexpense: date.toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            }).replace(",", ""),
                                        });
                                    }
                                }}
                                dateFormat="dd MMM yyyy"
                                className="mb-2 w-full px-4 py-2 border rounded"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                            {!newExpense.dateofexpense.trim() && (
                                <p className="text-red-500 text-sm mt-1">Date is required</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                            <Input
                                type="text"
                                placeholder="Remarks"
                                value={newExpense.remarks}
                                onChange={(e) => setNewExpense({...newExpense, remarks: e.target.value})}
                                className="mb-2"
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}
                            />
                        </div>
                        {/* Buttons - Centered */}
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                className="bg-gray-500 text-white px-4 py-2 rounded cursor-pointer"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setNewExpense({
                                        name: "",
                                        cost: "",
                                        dateofexpense: new Date().toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        }).replace(",", ""),
                                        remarks: ""
                                    });
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className={`px-4 py-2 rounded ${
                                    isAdding || !isAddExpenseFormValid ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-500 text-white cursor-pointer"
                                }`}
                                onClick={handleAddExpense}
                                disabled={isAdding || !isAddExpenseFormValid}
                            >
                                {isAdding ? "Adding..." : "Add"}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>)}</div>
    );
};

export default OfficeExpenses;