import React, {useEffect, useState} from "react";
import axios from "axios";
import Modal from "@/components/Modal/Modal";
import ClipLoader from "react-spinners/ClipLoader";
import toast from "react-hot-toast";
import {Input} from "@headlessui/react";

const ExpandableProjectForm = ({
                                  projectWithExpenses,
                                  dropDownOptions,
                                  onChangeHandler,
                              }) => {
    const [expenseList, setExpenseList] = useState(projectWithExpenses?.expense);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);



    const handleAddExpense = () => {
        setExpenseList([...expenseList, {
            id: "",
            name: "",
            recipe_ingredient_quantity: 0,
            ingredient_quantity: 1,
            unit: "",
            ingredient_cost: 0,
            recipe_ingredient_cost: 0
        }]);
    };



    const handleDeleteExpenses = (index) => {
        const updatedExpenses = [...expenseList];
        updatedExpenses.splice(index, 1);
        setExpenseList(updatedExpenses);
    };

    const handleSave = async () => {
        console.log("handle save: " + JSON.stringify(recipeWithIngredients));
        const payload = {
            name: recipeWithIngredients?.name,
            percent,
            ingredients: ingredientList.map(({id, recipe_ingredient_quantity}) => ({
                id,
                quantity: recipe_ingredient_quantity
            })),
            package_cost: packagingCost,
            miscellaneous_cost: miscellaneousCost,
            notes: notes,
        };
        try {
            await axios.put(`/api/v1/recipe/${recipeWithIngredients?.id}`, payload);
            console.log("Recipe saved successfully!");
            toast.success("Recipe created successfully!");
            onChangeHandler();
        } catch (error) {
            console.error("Error saving recipe", error);
        }
    };

    const handleDelete = async () => {
        console.log('Delete')
        try {
            await axios.delete(`/api/v1/recipe/${recipeWithIngredients?.id}`);
            toast.success("Recipe deleted successfully!");
            onChangeHandler();
        } catch (error) {
            console.error("Error deleting recipe", error);
        }
    }

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg mb-4 overflow-hidden transition-all duration-300">
            {/* Recipe Header - Always Visible */}
            <div
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={toggleExpand}
            >
                <div className="flex items-center">
                    <div
                        className={`transform transition-transform duration-200 mr-2 ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{projectWithExpenses?.name}</h2>
                </div>

                <button
                    onClick={() => handleDelete()}
                    className="text-red-600 hover:text-red-800 cursor-pointer hover:bg-gray-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>

            {/* Expandable Content */}
            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-6 border-t flex flex-col">
                    {/* Make this content area scrollable */}
                    <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                        {/* Cost adjustment inputs in a grid layout */}
                        <div className="flex justify-between mb-6">
                            <div className="flex items-center">
                                <label className="mr-2 font-medium text-gray-700">Adjusted ingredients percent:</label>
                                <Input
                                    type="number"
                                    value={percent}
                                    onChange={(e) => handlePercentChange(e.target.value)}
                                    className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="mr-2 font-medium text-gray-700">Packaging cost:</label>
                                <input
                                    type="number"
                                    value={packagingCost}
                                    onChange={(e) => setPackagingCost(e.target.value)}
                                    className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="mr-2 font-medium text-gray-700">Miscellaneous cost:</label>
                                <input
                                    type="number"
                                    value={miscellaneousCost}
                                    onChange={(e) => setMiscellaneousCost(e.target.value)}
                                    className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="mb-6">
                            <label className="block font-medium text-gray-700 mb-2">Notes:</label>
                            <textarea
                                value={notes || ""}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes here"
                                className="w-full border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-gray-700 resize-y"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="py-2 px-4 text-left font-semibold text-gray-700">Ingredient Name</th>
                                    <th className="py-2 px-4 text-left font-semibold text-gray-700">Quantity</th>
                                    <th className="py-2 px-4 text-left font-semibold text-gray-700">Unit</th>
                                    <th className="py-2 px-4 text-left font-semibold text-gray-700">Cost</th>
                                    <th className="py-2 px-4 text-left font-semibold text-gray-700">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {ingredientList.map((ingredient, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-4">
                                            {ingredient.id ? (
                                                <span className="font-medium">{ingredient.name}</span>
                                            ) : (
                                                <select
                                                    onChange={(e) => handleIngredientSelect(index, e.target.value)}
                                                    className="border rounded px-2 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Ingredient</option>
                                                    {dropDownOptions.map((option) => (
                                                        <option key={option.id} value={option.id}>{option.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td className="py-2 px-4">
                                            <input
                                                type="number"
                                                value={ingredient.recipe_ingredient_quantity}
                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                className="border rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="py-2 px-4 text-gray-600">{ingredient.unit}</td>
                                        <td className="py-2 px-4 font-medium">₹{ingredient.recipe_ingredient_cost.toFixed(2)}</td>
                                        <td className="py-2 px-4">
                                            <button
                                                onClick={() => handleDeleteIngredient(index)}
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
                                <tfoot>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="py-2 px-4 text-right font-semibold">Total Ingredients
                                        Cost:
                                    </td>
                                    <td className="py-2 px-4 font-bold">₹{totalIngredientsCost.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="py-2 px-4 text-right font-semibold">Adjusted Ingredients
                                        Cost:
                                    </td>
                                    <td className="py-2 px-4 font-bold">₹{adjustedIngredientsCost.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="py-2 px-4 text-right font-semibold">Packaging cost:
                                    </td>
                                    <td className="py-2 px-4 font-bold">₹{parseInt(packagingCost).toFixed(2)}</td>
                                    <td></td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="py-2 px-4 text-right font-semibold">Miscellaneous Cost:
                                    </td>
                                    <td className="py-2 px-4 font-bold">₹{parseInt(miscellaneousCost).toFixed(2)}</td>
                                    <td></td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="py-2 px-4 text-right font-semibold">Display Price:</td>
                                    <td className="py-2 px-4 font-bold">₹{displayPrice.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Add Ingredient button placed right after table */}
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={handleAddIngredient}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                     viewBox="0 0 24 24"
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 4v16m8-8H4"/>
                                </svg>
                                Add Ingredient
                            </button>
                        </div>
                    </div>
                    {/* Action buttons moved to bottom */}
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 font-medium cursor-pointer"
                            onClick={() => onChangeHandler()}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer"
                        >
                            Update Recipe
                        </button>
                    </div>
                </div>
            </div>
            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Delete Ingredient</h2>
                <p className="text-base text-gray-600 mb-6">
                    Are you sure you want to delete <span className="font-medium">{recipeWithIngredients.name}</span>?
                    This action cannot be undone.
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
                        // disabled={isLoading}
                    >
                        {/*{isLoading ? <ClipLoader size={16} color="white" /> : "Delete"}*/}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ExpandableProjectForm;