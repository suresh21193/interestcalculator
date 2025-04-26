import React, { useState, useEffect  } from "react";
import Modal from "@/components/Modal/Modal";
import ClipLoader from "react-spinners/ClipLoader";
import { Input } from "@headlessui/react";
import toast from "react-hot-toast";
import {EmployeeWithPettycashResponse} from "@/types/types";
import axios from "axios";
import DatePicker from "react-datepicker";

interface Employee {
    empid: number;
    name: string;
    role: string;
    pettycashtotal: number;
    expensespent: number;
    calculatedbalance: number;
}

const EmployeeRow = ({
                         employeeWithPettyCash,
                         onChangeHandler,
                           refreshEmployees,
                         isExpanded,
                         toggleExpand,
                       }: {
    employeeWithPettyCash: EmployeeWithPettycashResponse;
    refreshEmployees: () => void;
    onChangeHandler: ()=> void;
    isExpanded: boolean;
    toggleExpand: () => void;
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editedEmployee, setEditedEmployee] = useState<Employee>({ ...employeeWithPettyCash });
    const [isLoading, setIsLoading] = useState(false);


    //project with pettycash
    const [pettycashList, setPettycashList] = useState(employeeWithPettyCash?.pettycash);
    // commented old
    //const [isExpanded, setIsExpanded] = useState(false);

    const API_BASE_URL = "http://localhost:3000";

    const isFormValid =
        editedEmployee.name.trim()  !== "" &&
        editedEmployee.role.trim()  !== "" ;

    // commented old
    /*const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };*/

    const handleUpdate = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/v1/employees/${employeeWithPettyCash.empid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editedEmployee),
            });

            if (!response.ok) throw new Error("Failed to update employee");

            console.log("Updated employee:", editedEmployee);
            toast.success("Employee updated successfully");
            setIsEditModalOpen(false);
            refreshEmployees();
        } catch (error) {
            console.error("Error updating Employee:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/v1/employees/${employeeWithPettyCash.empid}`, { method: "DELETE" });

            if (!response.ok) throw new Error("Failed to delete employee");

            console.log("Deleted employee:", employeeWithPettyCash.empid);
            toast.success("employee deleted successfully");
            setIsDeleteModalOpen(false);
            refreshEmployees();
        } catch (error) {
            console.error("Error deleting employee:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        console.log("handle save: " + JSON.stringify(employeeWithPettyCash));
        const payload = {
            empid: employeeWithPettyCash?.empid,
            pettycashes: pettycashList.map(({pettycashid, empid, pettycash, dateofpettycash}) => ({
                pettycashid:pettycashid,
                empid:empid,
                pettycash: pettycash,
                dateofpettycash: dateofpettycash
            })),
        };
        try {
            await axios.put(`${API_BASE_URL}/api/v1/employeewithpettycash/${employeeWithPettyCash?.empid}`, payload);
            console.log("Employee saved successfully!");
            toast.success("Employee petty cash Updated successfully!");
            onChangeHandler();
        } catch (error) {
            console.error("Error saving petty cash", error);
        }
    };

    const handleDeletePettycash = (index) => {
        const updatedPettycashes = [...pettycashList];
        updatedPettycashes.splice(index, 1);
        setPettycashList(updatedPettycashes);
    };

    /*const isRowValid = (pettycash: any) => {
        return (
            pettycash.pettycash?.trim() &&
            pettycash.dateofpettycash?.trim()
        );
    };*/

    const isRowValid = (pettycash: any): boolean => {
        return (
            pettycash.pettycash > 0 &&
            typeof pettycash.dateofpettycash === "string" &&
            pettycash.dateofpettycash.trim() !== ""
        );
    };

    const handleAddPettycash = () => {
        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-GB", {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, ' '); // Ensures space formatting
        setPettycashList([...pettycashList, {
            pettycash: 0,
            dateofpettycash:formattedDate,
        }]);
    };

    return (
        <>
            <tr className="hover:bg-gray-50 transition-colors duration-150"  onClick={toggleExpand}>
                {/* Project Header - Always Visible */}
                <td className="px-6 py-4 text-base font-medium text-gray-900">
                    <div className="flex items-center gap-x-2"> {/* ✅ CHANGED: make icon + text inline */}
                        <div
                            className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                        {employeeWithPettyCash.name} {/* ✅ CHANGED: now inside flex container */}
                    </div>
                </td>
                <td className="px-6 py-4 text-base text-gray-600">{employeeWithPettyCash.role}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">₹{employeeWithPettyCash.pettycashtotal}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">₹{employeeWithPettyCash.expensespent}</td>
                <td className="px-6 py-4 text-base font-medium text-gray-800">₹{employeeWithPettyCash.calculatedbalance}</td>
                <td className="px-6 py-4 text-base text-gray-600">
                    <div className="flex gap-4">
                        <button
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 rounded-md hover:bg-blue-50 cursor-pointer"
                            onClick={() => setIsEditModalOpen(true)}
                            aria-label="Edit employee"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                            </svg>
                        </button>

                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150 p-1 rounded-md hover:bg-red-50 cursor-pointer"
                            aria-label="Delete employee"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={6}> {/* <-- spans all columns */}
                        {/* Expandable Content */}
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
                            <div className="p-6 border-t flex flex-col">
                                {/*<div className="overflow-x-auto">
                                    <table className="w-full table-auto  bg-white">*/}
                                <div className="w-full max-h-[400px] overflow-y-auto">
                                    <table className="w-full table-auto bg-white">
                                        <thead>
                                        <tr className="bg-gray-100 border-b">
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Petty Cash</th>
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Petty Cash Date</th>
                                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {pettycashList.map((pettycash, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">

                                                <td className="py-2 px-4 w-[150px]" >
                                                    {/*<input
                                                        type="number"
                                                        value={pettycash.pettycash}
                                                        onChange={(e) => {
                                                            const updatedPettycash = [...pettycashList];
                                                            updatedPettycash[index].pettycash = parseFloat(e.target.value) || 0;
                                                            setPettycashList(updatedPettycash);
                                                        }}
                                                        className="border rounded px-2 py-1 w-full max-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        style={{ minWidth: '150px', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                                    />*/}
                                                    <input
                                                        type="number"
                                                        value={pettycash.pettycash === 0 ? "" : pettycash.pettycash}
                                                        onChange={(e) => {
                                                            const updatedPettycash = [...pettycashList];
                                                            const value = e.target.value;

                                                            updatedPettycash[index].pettycash = value === "" ? 0 : parseFloat(value);
                                                            setPettycashList(updatedPettycash);
                                                        }}
                                                        className="border rounded px-2 py-1 w-full max-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        style={{ minWidth: '150px', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                                    />
                                                </td>
                                                <td className="py-2 px-4 w-48">
                                                    <div className="w-full min-w-[150px]">
                                                        <DatePicker
                                                            selected={pettycash.dateofpettycash ? new Date(pettycash.dateofpettycash) : new Date()}
                                                            onChange={(date: Date | null) => {
                                                                const formattedDate = (date || new Date()).toLocaleDateString("en-GB", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                }).replace(",", "");

                                                                const updatedPettycash = [...pettycashList];
                                                                updatedPettycash[index].dateofpettycash = formattedDate;
                                                                setPettycashList(updatedPettycash);
                                                            }}
                                                            dateFormat="dd MMM yyyy"
                                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <button
                                                        onClick={() => handleDeletePettycash(index)}
                                                        className="text-red-600 hover:text-red-800 cursor-pointer hover:bg-gray-50"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                                             viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>

                                    </table>
                                </div>
                                {/* Add Expense button placed right after table */}
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={handleAddPettycash}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                             viewBox="0 0 24 24"
                                             stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M12 4v16m8-8H4"/>
                                        </svg>
                                        Add PettyCash
                                    </button>
                                </div>

                                {/* Action buttons moved to bottom */}
                                <div className="mt-6 flex justify-center gap-3">
                                    <button
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 font-medium cursor-pointer"
                                        onClick={() => onChangeHandler()}
                                    >
                                        Cancel
                                    </button>
                                    {/*<button
                                        onClick={handleSave}
                                        disabled={!isRowValid}
                                        className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer`}
                                    >
                                        Update Pettycash
                                    </button>*/}
                                    <button
                                        onClick={handleSave}
                                        disabled={!pettycashList.every(isRowValid)}
                                        className={`${
                                            pettycashList.every(isRowValid)
                                                ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                                : "bg-gray-400 cursor-not-allowed"
                                        } text-white font-medium py-2 px-4 rounded-md transition-colors`}
                                    >
                                        Update Pettycash
                                    </button>
                                </div>
                            </div>
                        </div>

                    </td>
                </tr>
            )}

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Employee</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input
                            type="text"
                            value={editedEmployee.name}
                            onChange={(e) => setEditedEmployee({ ...editedEmployee, name: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Employee name"
                        />
                        {!editedEmployee.name.trim() && (
                            <p className="text-red-500 text-sm mt-1">Name is required</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <Input
                            type="text"
                            value={editedEmployee.role}
                            onChange={(e) => setEditedEmployee({ ...editedEmployee, role: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="Employee name"
                        />
                        {!editedEmployee.role.trim() && (
                            <p className="text-red-500 text-sm mt-1">Role is required</p>
                        )}
                    </div>

                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 font-medium cursor-pointer"
                        /*onClick={() => setIsEditModalOpen(false)}*/
                        onClick={() => {
                            setEditedEmployee({ ...employeeWithPettyCash }); // 🔄 Reset to original
                            setIsEditModalOpen(false);       // ❌ Close modal
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className={`cursor-pointer px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-150 font-medium ${
                            isFormValid
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={handleUpdate}
                        disabled={!isFormValid || isLoading}
                    >
                        {isLoading ? <ClipLoader size={16} color="white" /> : "Save Changes"}
                    </button>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Delete Employee</h2>
                <p className="text-base text-gray-600 mb-6">
                    Are you sure you want to delete <span className="font-medium">{employeeWithPettyCash.name}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4 mt-4">
                    <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 font-medium cursor-pointer"
                        onClick={() => setIsDeleteModalOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-150 font-medium cursor-pointer"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? <ClipLoader size={16} color="white" /> : "Delete"}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default EmployeeRow;