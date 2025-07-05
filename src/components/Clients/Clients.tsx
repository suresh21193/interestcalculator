import React, { useState, useEffect, useCallback } from "react";


const headerColor = "bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-900"; // unified header color

const Clients = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedPrincipal, setExpandedPrincipal] = useState<{ [key: number]: number | null }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    ClientID: "",
    Name: "",
    MobileNumber: "",
    Place: "",
    Address: "",
    Zone: "",
    Status: "",
  });

  // Edit state for Client
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    Name: "",
    MobileNumber: "",
    Place: "",
    Address: "",
    Zone: "",
    Status: "",
  });

  // Edit state for Principal
  const [editPrincipal, setEditPrincipal] = useState<{ clientIdx: number | null; principalIdx: number | null }>({ clientIdx: null, principalIdx: null });
  const [editPrincipalForm, setEditPrincipalForm] = useState({
    PrincipalAmount: "",
    StartDate: "",
    Term: "1",
    InterestAmount: "",
    Remarks: "",
    Status: "Open",
    ClosedDate: "",
  });

  // Edit state for Interest
  const [editInterest, setEditInterest] = useState<{ clientIdx: number | null; principalIdx: number | null; interestIdx: number | null }>({ clientIdx: null, principalIdx: null, interestIdx: null });
  const [editInterestForm, setEditInterestForm] = useState({
    InterestReceived: "",
    InterestReceivedDate: "",
    Status: "Received",
    InterestMonth: "", // Add InterestMonth to the form state
  });

  // Add Principal Modal State
  const [isAddPrincipalOpen, setIsAddPrincipalOpen] = useState<{ clientIdx: number | null }>({ clientIdx: null });
  const [addPrincipalForm, setAddPrincipalForm] = useState({
    PrincipalAmount: "",
    StartDate: "",
    Term: "1",
    InterestAmount: "",
    Remarks: "",
    Status: "Open",
  });

  // Add Interest Modal State
  const [isAddInterestOpen, setIsAddInterestOpen] = useState<{ clientIdx: number | null; principalIdx: number | null }>({
    clientIdx: null,
    principalIdx: null,
  });
  const [addInterestForm, setAddInterestForm] = useState({
    InterestReceived: "",
    InterestReceivedDate: "",
    Status: "Received",
    InterestMonth: "", // Add InterestMonth to the form state
  });

  // Validation state for Add Client form
  const [formErrors, setFormErrors] = useState({
    Name: "",
    MobileNumber: "",
    Place: "",
    Address: "",
    Zone: "",
    Status: "",
  });

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "" }>({ message: "", type: "" });

  // State for delete confirmation modal
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  // State for delete confirmation modal for Principal
  const [deletePrincipal, setDeletePrincipal] = useState<{ clientIdx: number | null; principalIdx: number | null }>({ clientIdx: null, principalIdx: null });

  // State for delete confirmation modal for Interest
  const [deleteInterest, setDeleteInterest] = useState<{ clientIdx: number | null; principalIdx: number | null; interestIdx: number | null }>({
    clientIdx: null,
    principalIdx: null,
    interestIdx: null,
  });

  // --- Filter State ---
  const [filters, setFilters] = useState({
    name: "",
    place: "",
    zone: "",
    clientStatus: "",
    principalTerm: "",
    principalStatus: "",
    interestStatus: "",
  });

  // --- Dropdown options (populate dynamically or statically as needed) ---
  const [places, setPlaces] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [clientStatuses] = useState(["Open", "Inactive", "Closed"]);
  const [principalTerms] = useState(["1", "3"]);
  const [principalStatuses] = useState(["Open", "Closed"]);
  const [interestStatuses] = useState(["Received", "Pending"]);

  // Populate dropdowns from clients data
  useEffect(() => {
    setPlaces([...new Set(clients.map(c => c.Place).filter(Boolean))]);
    setZones([...new Set(clients.map(c => c.Zone).filter(Boolean))]);
  }, [clients]);

  // --- Filtered Clients ---
  const filteredClients = clients
  .map(client => {
    // Client filters
    if (filters.name && !client.Name.toLowerCase().includes(filters.name.toLowerCase())) return null;
    if (filters.place && client.Place !== filters.place) return null;
    if (filters.zone && client.Zone !== filters.zone) return null;
    if (filters.clientStatus && client.Status !== filters.clientStatus) return null;

    // Principal filters (apply to principal table as well)
    let principals = client.principals || [];
    let principalFilterApplied = false;

    if (filters.principalTerm) {
      principalFilterApplied = true;
      principals = principals.filter(principal => String(principal.Term) === String(filters.principalTerm));
    }
    if (filters.principalStatus) {
      principalFilterApplied = true;
      principals = principals.filter(principal => principal.Status === filters.principalStatus);
    }

    // Interest Status filter (apply to principal and interest tables)
    if (filters.interestStatus) {
      principalFilterApplied = true;
      principals = principals
        .map(principal => {
          const interests = Array.isArray(principal.interests)
            ? principal.interests.filter(
                interest => interest.Status === filters.interestStatus
              )
            : [];
          // Only keep principal if it has matching interests
          if (interests.length === 0) return null;
          return { ...principal, interests };
        })
        .filter(Boolean);
    }

    // If any principal filter is applied, only include clients with matching principals
    if (principalFilterApplied && principals.length === 0) return null;

    // Always return the client, but with filtered principals (could be empty if no principal filter)
    return { ...client, principals };
  })
  .filter(Boolean);

  // --- Filter Change Handler ---
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Helper to check if form is valid
  const isFormValid = () => {
    return (
      form.Name.trim() !== "" &&
      form.MobileNumber.trim() !== "" &&
      form.Place.trim() !== "" &&
      form.Address.trim() !== "" &&
      form.Zone.trim() !== "" &&
      form.Status !== "" // Status must be selected
    );
  };

  // Validate fields on change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    setFormErrors((prev) => ({
      ...prev,
      [name]:
        value.trim() === ""
          ? `${name === "Status" ? "Status" : name} required`
          : name === "Status" && value === ""
          ? "Status required"
          : "",
    }));
  };

  // On submit, check all fields
  const handleAddClient = async () => {
    const errors: any = {};
    if (form.Name.trim() === "") errors.Name = "Name required";
    if (form.MobileNumber.trim() === "") errors.MobileNumber = "Mobile Number required";
    if (form.Place.trim() === "") errors.Place = "Place required";
    if (form.Address.trim() === "") errors.Address = "Address required";
    if (form.Zone.trim() === "") errors.Zone = "Zone required";
    if (form.Status === "") errors.Status = "Status required";

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        const response = await fetch("/api/v1/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Name: form.Name,
            MobileNumber: form.MobileNumber,
            Place: form.Place,
            Address: form.Address,
            Zone: form.Zone,
            Status: form.Status,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setClients([...clients, { ...data.client, principals: [] }]);
          setForm({
            ClientID: "",
            Name: "",
            MobileNumber: "",
            Place: "",
            Address: "",
            Zone: "",
            Status: "",
          });
          setIsModalOpen(false);
          setFormErrors({
            Name: "",
            MobileNumber: "",
            Place: "",
            Address: "",
            Zone: "",
            Status: "",
          });
          setToast({ message: "Client added successfully!", type: "success" });
        } else {
          const err = await response.json();
          setToast({ message: err.error || "Failed to add client", type: "error" });
        }
      } catch (error) {
        setToast({ message: "Failed to add client", type: "error" });
      }
      setTimeout(() => setToast({ message: "", type: "" }), 3000);
    }
  };

  // Fetch clients from API on mount
  useEffect(() => {
    fetch("/api/v1/clients")
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) setClients(data.clients);
      })
      .catch((err) => {
        // Optionally handle error
        console.error("Failed to fetch clients", err);
      });
  }, []);

  // --- Client handlers ---
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleAddPrincipalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddPrincipalForm({ ...addPrincipalForm, [e.target.name]: e.target.value });
  };
  const handleAddInterestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddInterestForm({ ...addInterestForm, [e.target.name]: e.target.value });
  };

  // Add this handler for editing interest fields
  const handleEditInterestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditInterestForm({ ...editInterestForm, [e.target.name]: e.target.value });
  };

  // Helper to check if form is valid
  const isFormValidClient = () => {
    return (
      form.Name.trim() !== "" &&
      form.MobileNumber.trim() !== "" &&
      form.Place.trim() !== "" &&
      form.Address.trim() !== "" &&
      form.Zone.trim() !== "" &&
      form.Status !== "" // Status must be selected
    );
  };

  const handleAddClientSubmit = () => {
    const errors: any = {};
    if (form.Name.trim() === "") errors.Name = "Name required";
    if (form.MobileNumber.trim() === "") errors.MobileNumber = "Mobile Number required";
    if (form.Place.trim() === "") errors.Place = "Place required";
    if (form.Address.trim() === "") errors.Address = "Address required";
    if (form.Zone.trim() === "") errors.Zone = "Zone required";
    if (form.Status === "") errors.Status = "Status required";

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setClients([...clients, { ...form, principals: [] }]);
      setForm({
        ClientID: "",
        Name: "",
        MobileNumber: "",
        Place: "",
        Address: "",
        Zone: "",
        Status: "",
      });
      setIsModalOpen(false);
    }
  };

  // Delete handler
  const handleDelete = (globalIdx: number) => {
    setDeleteIdx(globalIdx);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (deleteIdx === null) return;
    const client = filteredClients[deleteIdx];
    const originalIdx = clients.findIndex(cl => cl.ClientID === client.ClientID);
    try {
      const response = await fetch("/api/v1/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ClientID: client.ClientID }),
      });
      if (response.ok) {
        setClients(clients.filter((_, i) => i !== originalIdx));
        setToast({ message: "Client deleted successfully!", type: "success" });
      } else {
        const err = await response.json();
        setToast({ message: err.error || "Failed to delete client", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to delete client", type: "error" });
    }
    setDeleteIdx(null);
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteIdx(null);
  };

  const handleRowClick = (globalIdx: number) => {
    setExpandedRow(expandedRow === globalIdx ? null : globalIdx);
  };

  const handlePrincipalRowClick = (clientIdx: number, principalIdx: number) => {
    setExpandedPrincipal((prev) => ({
      ...prev,
      [clientIdx]: prev[clientIdx] === principalIdx ? null : principalIdx,
    }));
  };

  // --- Client Edit logic ---
  const handleEdit = (globalIdx: number) => {
  const client = filteredClients[globalIdx];
  setEditIndex(globalIdx);
  setEditForm({
    Name: client.Name,
    MobileNumber: client.MobileNumber,
    Place: client.Place,
    Address: client.Address,
    Zone: client.Zone,
    Status: client.Status,
  });
};

  // Update client using PUT API
  const handleUpdate = async (globalIdx: number) => {
    const client = filteredClients[globalIdx];
    const originalIdx = clients.findIndex(cl => cl.ClientID === client.ClientID);
    try {
      const response = await fetch("/api/v1/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ClientID: client.ClientID,
          Name: editForm.Name,
          MobileNumber: editForm.MobileNumber,
          Place: editForm.Place,
          Address: editForm.Address,
          Zone: editForm.Zone,
          Status: editForm.Status,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const updatedClients = [...clients];
        updatedClients[originalIdx] = { ...updatedClients[originalIdx], ...data.client };
        setClients(updatedClients);
        setEditIndex(null);
        setToast({ message: "Client updated successfully!", type: "success" });
      } else {
        const err = await response.json();
        setToast({ message: err.error || "Failed to update client", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to update client", type: "error" });
    }
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
  };

  // --- Principal Edit logic ---
  const handleEditPrincipal = (clientIdx: number, principalIdx: number) => {
    const principal = clients[clientIdx].principals[principalIdx];
    setEditPrincipal({ clientIdx, principalIdx });
    setEditPrincipalForm({
      PrincipalAmount: principal.PrincipalAmount.toString(),
      StartDate: principal.StartDate,
      Term: principal.Term,
      InterestAmount: principal.InterestAmount.toString(),
      Remarks: principal.Remarks,
      Status: principal.Status,
      ClosedDate: principal.ClosedDate,
    });
  };

  const handleEditPrincipalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditPrincipalForm({ ...editPrincipalForm, [e.target.name]: e.target.value });
  };

  const handleCancelEditPrincipal = () => {
  setEditPrincipal({ clientIdx: null, principalIdx: null });
  };

  // --- Delete Principal Handler (API) ---
  const handleDeletePrincipal = (clientIdx: number, principalIdx: number) => {
    setDeletePrincipal({ clientIdx, principalIdx });
  };

  const handleConfirmDeletePrincipal = async () => {
    if (deletePrincipal.clientIdx === null || deletePrincipal.principalIdx === null) return;
    const clientIdx = deletePrincipal.clientIdx;
    const principalIdx = deletePrincipal.principalIdx;
    const principal = clients[clientIdx].principals[principalIdx];
    try {
      const response = await fetch("/api/v1/principal", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PrincipalID: principal.PrincipalID }),
      });
      if (response.ok) {
        const updatedClients = [...clients];
        updatedClients[clientIdx].principals.splice(principalIdx, 1);
        setClients(updatedClients);
        setToast({ message: "Principal deleted successfully!", type: "success" });
      } else {
        const err = await response.json();
        setToast({ message: err.error || "Failed to delete principal", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to delete principal", type: "error" });
    }
    setDeletePrincipal({ clientIdx: null, principalIdx: null });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleCancelDeletePrincipal = () => {
    setDeletePrincipal({ clientIdx: null, principalIdx: null });
  };

  // --- Add Principal Handlers ---
  const handleAddPrincipal = async () => {
    if (isAddPrincipalOpen.clientIdx === null) return;
    // Get the client from filteredClients using the global index
    const client = filteredClients[isAddPrincipalOpen.clientIdx];
    // Find the original index in the main clients array using ClientID
    const originalIdx = clients.findIndex(cl => cl.ClientID === client.ClientID);
    try {
      const response = await fetch("/api/v1/principal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PrincipalAmount: addPrincipalForm.PrincipalAmount,
          StartDate: addPrincipalForm.StartDate,
          Term: addPrincipalForm.Term,
          InterestAmount: addPrincipalForm.InterestAmount,
          Remarks: addPrincipalForm.Remarks,
          Status: addPrincipalForm.Status,
          ClientID: client.ClientID,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const updatedClients = [...clients];
        // Use originalIdx here, not isAddPrincipalOpen.clientIdx
        updatedClients[originalIdx].principals.push({ ...data.principal, interests: [] });
        setClients(updatedClients);
        setToast({ message: "Principal added successfully!", type: "success" });
        setIsAddPrincipalOpen({ clientIdx: null });
        setAddPrincipalForm({
          PrincipalAmount: "",
          StartDate: "",
          Term: "1",
          InterestAmount: "",
          Remarks: "",
          Status: "Open",
        });
      } else {
        const err = await response.json();
        setToast({ message: err.error || "Failed to add principal", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to add principal", type: "error" });
    }
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // --- Update Principal Handler (API) ---
  const handleUpdatePrincipal = async () => {
    if (editPrincipal.clientIdx === null || editPrincipal.principalIdx === null) return;
    // Get the client from filteredClients using the global index
    const client = filteredClients[editPrincipal.clientIdx];
    // Find the original index in the main clients array using ClientID
    const originalIdx = clients.findIndex(cl => cl.ClientID === client.ClientID);
    const principalIdx = editPrincipal.principalIdx;
    const principal = clients[originalIdx].principals[principalIdx];

    try {
      const response = await fetch("/api/v1/principal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PrincipalID: principal.PrincipalID,
          PrincipalAmount: editPrincipalForm.PrincipalAmount,
          StartDate: editPrincipalForm.StartDate,
          Term: editPrincipalForm.Term,
          InterestAmount: editPrincipalForm.InterestAmount,
          Remarks: editPrincipalForm.Remarks,
          Status: editPrincipalForm.Status,
          ClosedDate: editPrincipalForm.ClosedDate,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const updatedClients = [...clients];
        updatedClients[originalIdx].principals[principalIdx] = {
          ...data.principal,
          interests: principal.interests || [],
        };
        setClients(updatedClients);
        setEditPrincipal({ clientIdx: null, principalIdx: null });
        setToast({ message: "Principal updated successfully!", type: "success" });
      } else {
        const err = await response.json();
        setToast({ message: err.error || "Failed to update principal", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to update principal", type: "error" });
    }
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // --- Add Interest Handler (API) ---
  const handleAddInterest = async () => {
    if (isAddInterestOpen.clientIdx === null || isAddInterestOpen.principalIdx === null) return;
    const clientIdx = isAddInterestOpen.clientIdx;
    const principalIdx = isAddInterestOpen.principalIdx;
    const principal = clients[clientIdx].principals[principalIdx];
    
    // Check if InterestMonth already exists for this principal
    const exists = (principal.interests || []).some(
      i =>
        i.InterestMonth &&
        i.InterestMonth.slice(0, 7) === addInterestForm.InterestMonth
    );
    if (exists) {
      setIsAddInterestOpen({ clientIdx: null, principalIdx: null }); // Close the add interest modal
      setToast({
        message: "Interest month already exists for the principal, pls update in the Interest table",
        type: "error",
      });
      setTimeout(() => setToast({ message: "", type: "" }), 3000);
      return;
    }
    
    try {
      const response = await fetch("/api/v1/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          InterestReceived: addInterestForm.InterestReceived,
          InterestReceivedDate: addInterestForm.InterestReceivedDate,
          Status: addInterestForm.Status, // include Status
          PrincipalID: principal.PrincipalID,
          InterestMonth: addInterestForm.InterestMonth, // include InterestMonth
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const updatedClients = [...clients];
        updatedClients[clientIdx].principals[principalIdx].interests.push(data.interest);
        setClients(updatedClients);
        setToast({ message: "Interest added successfully!", type: "success" });
        setIsAddInterestOpen({ clientIdx: null, principalIdx: null });
        setAddInterestForm({
          InterestReceived: "",
          InterestReceivedDate: "",
          Status: "Received",
          InterestMonth: "", // Reset InterestMonth
        });
      } else {
        const err = await response.json();
        setToast({ message: err.error || "Failed to add interest", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to add interest", type: "error" });
    }
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleCancelEditInterest = () => {
  setEditInterest({ clientIdx: null, principalIdx: null, interestIdx: null });
  };

  //commented on May21- 
  // const handleEditInterest = (clientIdx: number, principalIdx: number, interestIdx: number) => {
  //   const interest = clients[clientIdx].principals[principalIdx].interests[interestIdx];
  //   setEditInterest({ clientIdx, principalIdx, interestIdx });
  //   setEditInterestForm({
  //     InterestReceived: interest.InterestReceived,
  //     InterestReceivedDate: interest.InterestReceivedDate,
  //     Status: interest.Status || "Received",
  //     InterestMonth: interest.InterestMonth || "", // Set InterestMonth for editing
  //   });
  // };

  const handleEditInterest = (globalIdx: number, principalIdx: number, interestIdx: number) => {
    // Get the client from filteredClients using the global index
    const client = filteredClients[globalIdx];
    // Find the original index in the main clients array using ClientID
    const originalIdx = clients.findIndex(cl => cl.ClientID === client.ClientID);
    const interest = clients[originalIdx].principals[principalIdx].interests[interestIdx];

    // Format InterestMonth as "yyyy-mm" if it's a valid date string
    let formattedMonth = "";
    if (interest.InterestMonth) {
      const d = new Date(interest.InterestMonth);
      if (!isNaN(d.getTime())) {
        formattedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
    }

    setEditInterest({ clientIdx: globalIdx, principalIdx, interestIdx });
    setEditInterestForm({
      InterestReceived: interest.InterestReceived,
      InterestReceivedDate: interest.InterestReceivedDate,
      Status: interest.Status || "Received",
      InterestMonth: formattedMonth,
    });
  };

  // --- Update Interest Handler (API) ---
  const handleUpdateInterest = async () => {
    if (
      editInterest.clientIdx === null ||
      
      editInterest.principalIdx === null ||
      editInterest.interestIdx === null
    )
      return;
    const clientIdx = editInterest.clientIdx;
    const principalIdx = editInterest.principalIdx;
    const interestIdx = editInterest.interestIdx;
    const interest = clients[clientIdx].principals[principalIdx].interests[interestIdx];
    try {
      const response = await fetch("/api/v1/interest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          InterestID: interest.InterestID,
          InterestReceived: editInterestForm.InterestReceived,
          InterestReceivedDate: editInterestForm.InterestReceivedDate,
          Status: editInterestForm.Status, // include Status
          InterestMonth: editInterestForm.InterestMonth, // include InterestMonth
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const updatedClients = [...clients];
        updatedClients[clientIdx].principals[principalIdx].interests[interestIdx] = {
          ...data.interest,
        };
        setClients(updatedClients);
        setEditInterest({ clientIdx: null, principalIdx: null, interestIdx: null });
        setToast({ message: "Interest updated successfully!", type: "success" });
      } else {
        const err = await response.json();
        setToast({ message: err.error || "Failed to update interest", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to update interest", type: "error" });
    }
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // --- Delete Interest Handler (API) ---
  const handleDeleteInterest = (clientIdx: number, principalIdx: number, interestIdx: number) => {
    setDeleteInterest({ clientIdx, principalIdx, interestIdx });
  };

  const handleConfirmDeleteInterest = async () => {
    if (
      deleteInterest.clientIdx === null ||
      deleteInterest.principalIdx === null ||
      deleteInterest.interestIdx === null
    )
      return;
    const clientIdx = deleteInterest.clientIdx;
    const principalIdx = deleteInterest.principalIdx;
    const interestIdx = deleteInterest.interestIdx;
    const interest = clients[clientIdx].principals[principalIdx].interests[interestIdx];
    try {
      const response = await fetch("/api/v1/interest", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ InterestID: interest.InterestID }),
      });
      if (response.ok) {
        const updatedClients = [...clients];
        updatedClients[clientIdx].principals[principalIdx].interests.splice(interestIdx, 1);
        setClients(updatedClients);
        setToast({ message: "Interest deleted successfully!", type: "success" });
      } else {
        const err = await response.json();
        setToast({ message: err.error || "Failed to delete interest", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to delete interest", type: "error" });
    }
    setDeleteInterest({ clientIdx: null, principalIdx: null, interestIdx: null });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleCancelDeleteInterest = () => {
    setDeleteInterest({ clientIdx: null, principalIdx: null, interestIdx: null });
  };

  // In your component, define the zone options:
  const zoneOptions = ["A", "B", "C", "Others"];

  // Add this function before your return statement
  const handleClearFilters = () => {
    setFilters({
      name: "",
      place: "",
      zone: "",
      clientStatus: "",
      principalTerm: "",
      principalStatus: "",
      interestStatus: "",
    });
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset to first page if filters change and current page is out of range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredClients, totalPages]);

  // Calculate total PrincipalAmount
  const totalPrincipalAmount = filteredClients.reduce((sum, client) => {
    // If client.principals is an array, sum all PrincipalAmount in that array
    if (Array.isArray(client.principals)) {
      return (
        sum +
        client.principals.reduce((pSum, p) => {
          let val = p.PrincipalAmount;
          if (typeof val === "string") {
            val = val.replace(/[^0-9.-]+/g, "");
            val = parseFloat(val);
          }
          if (typeof val !== "number" || isNaN(val)) val = 0;
          return pSum + val;
        }, 0)
      );
    }
    return sum;
  }, 0);

  // Helper to get month difference between two dates (yyyy-mm-dd)
  function getMonthDiff(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth())
    );
  }

  // Calculate total Interest Amount for a client
  const getClientInterestTotal = (client) => {
    if (!Array.isArray(client.principals)) return 0;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return client.principals.reduce((sum, p) => {
      const startMonth = p.StartDate?.slice(0, 7) + "-01";
      const months = getMonthDiff(startMonth, currentMonthStr);
      let interest = months * (parseFloat(String(p.InterestAmount).replace(/[^0-9.-]+/g, "")) || 0);
      return sum + interest;
    }, 0);
  };

  // For each client's principal table, calculate the total for that client only:
  const getClientPrincipalTotal = (client) => {
    if (!Array.isArray(client.principals)) return 0;
    return client.principals.reduce((sum, p) => {
      let val = p.PrincipalAmount;
      if (typeof val === "string") {
        val = val.replace(/[^0-9.-]+/g, "");
        val = parseFloat(val);
      }
      if (typeof val !== "number" || isNaN(val)) val = 0;
      return sum + val;
    }, 0);
  };

  // Helper to get total InterestReceived for a principal's Interest table
  const getPrincipalInterestReceivedTotal = (principal) => {
    if (!Array.isArray(principal.interests)) return 0;
    return principal.interests.reduce((sum, interest) => {
      let val = interest.InterestReceived;
      if (typeof val === "string") {
        val = val.replace(/[^0-9.-]+/g, "");
        val = parseFloat(val);
      }
      if (typeof val !== "number" || isNaN(val)) val = 0;
      return sum + val;
    }, 0);
  };

  // Helper to get total InterestReceived for a client's principals' Interest table
  const getClientInterestReceivedTotal = (client) => {
    if (!Array.isArray(client.principals)) return 0;
    return client.principals.reduce((sum, principal) => {
      if (!Array.isArray(principal.interests)) return sum;
      const interestSum = principal.interests.reduce((iSum, interest) => {
        let val = interest.InterestReceived;
        if (typeof val === "string") {
          val = val.replace(/[^0-9.-]+/g, "");
          val = parseFloat(val);
        }
        if (typeof val !== "number" || isNaN(val)) val = 0;
        return iSum + val;
      }, 0);
      return sum + interestSum;
    }, 0);
  };



  // Get current month in yyyy-mm format
  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  // Download PDF handler
  const handleDownloadPDF = useCallback(async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const now = new Date();
    const filename = `ClientDetails_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.pdf`;

    const doc = new jsPDF();

    // --- Client Table ---
    doc.text("Clients", 14, 16);
    autoTable(doc, {
      head: [[
        "Name", "MobileNumber", "Place", "Address", "Zone", "Status"
      ]],
      body: filteredClients.map(client => [
        client.Name,
        client.MobileNumber,
        client.Place,
        client.Address,
        client.Zone,
        client.Status,
      ]),
      startY: 20,
      styles: { fontSize: 8 },
      theme: "grid",
      foot: [
        [
          { content: "Total Clients", colSpan: 4, styles: { halign: "right" } },
          { content: filteredClients.length.toString(), styles: { halign: "left" } }
        ]
      ]
    });

    let nextY = doc.lastAutoTable.finalY + 10 || 30;

    // --- Principal Table for each client ---
    filteredClients.forEach((client) => {
      doc.text(`Principals- ${client.Name}`, 14, nextY);

      autoTable(doc, {
        head: [[
          "StartDate","PrincipalAmount", "Term", "InterestAmount", "Remarks", "Status", "ClosedDate"
        ]],
        body: (client.principals || []).map(principal => [
          principal.StartDate,
          principal.PrincipalAmount,
          principal.Term,
          principal.InterestAmount,
          principal.Remarks,
          principal.Status,
          principal.ClosedDate,
        ]),
        startY: nextY + 4,
        styles: { fontSize: 8 },
        theme: "grid",
        foot: [
          [
            { content: "Total Principal", colSpan: 1, styles: { halign: "right" } },
            {
              content: client.principals
                ? "Rs." +
                  client.principals
                    .reduce((sum, p) => {
                      let val = p.PrincipalAmount;
                      if (typeof val === "string") {
                        val = val.replace(/[^0-9.-]+/g, "");
                        val = parseFloat(val);
                      }
                      if (typeof val !== "number" || isNaN(val)) val = 0;
                      return sum + val;
                    }, 0)
                    .toLocaleString("en-IN", { maximumFractionDigits: 0 })
                : "Rs.0",
              styles: { halign: "left" }
            },
            { content: "Total Interest to be received:", colSpan: 1, styles: { halign: "right" } },
            {
              content: client.principals
                ? "Rs." +
                  client.principals
                    .reduce((sum, p) => {
                      let val = p.InterestAmount;
                      if (typeof val === "string") {
                        val = val.replace(/[^0-9.-]+/g, "");
                        val = parseFloat(val);
                      }
                      if (typeof val !== "number" || isNaN(val)) val = 0;
                      // Calculate months difference
                      const now = new Date();
                      const startMonth = p.StartDate?.slice(0, 7) + "-01";
                      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
                      function getMonthDiff(start: string, end: string) {
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        return (
                          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                          (endDate.getMonth() - startDate.getMonth())
                        );
                      }
                      const months = getMonthDiff(startMonth, currentMonthStr);
                      return sum + months * val;
                    }, 0)
                    .toLocaleString("en-IN", { maximumFractionDigits: 0 })
                : "Rs.0",
              styles: { halign: "left" }
            },
            { content: "", styles: { halign: "left" } }
          ]
        ]
      });

      nextY = doc.lastAutoTable.finalY + 10 || nextY + 30;

      // --- Interest Table for each principal ---
      (client.principals || []).forEach((principal) => {
        doc.text(
          `Interest for Principal ${principal.PrincipalAmount}- StartDate ${principal.StartDate} (${client.Name})`,
          14,
          nextY
        );
        autoTable(doc, {
          head: [[
            "InterestReceived",
            "InterestReceivedDate",
            "InterestMonth",
            "Status"
          ]],
          body: (principal.interests || []).map(interest => [
            interest.InterestReceived,
            interest.InterestReceivedDate,
            interest.InterestMonth
              ? (() => {
                  const d = new Date(interest.InterestMonth);
                  return !isNaN(d.getTime())
                    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
                    : interest.InterestMonth;
                })()
              : "",
            interest.Status
          ]),
          startY: nextY + 4,
          styles: { fontSize: 8 },
          theme: "grid",
          foot: [
            [
              { content: "Total Interest Received", colSpan: 1, styles: { halign: "right" } },
              {
                content: principal.interests
                  ? "Rs." +
                    principal.interests
                      .reduce((sum, i) => {
                        let val = i.InterestReceived;
                        if (typeof val === "string") {
                          val = val.replace(/[^0-9.-]+/g, "");
                          val = parseFloat(val);
                        }
                        if (typeof val !== "number" || isNaN(val)) val = 0;
                        return sum + val;
                      }, 0)
                      .toLocaleString("en-IN", { maximumFractionDigits: 0 })
                  : "Rs.0",
                styles: { halign: "left" }
              },
              { content: "", styles: { halign: "left" } },
              { content: "", styles: { halign: "left" } }
            ]
          ]
        });
        nextY = doc.lastAutoTable.finalY + 10 || nextY + 30;
      });
    });

    doc.save(filename);
  }, [filteredClients]);

  return (
    <div className="p-6 min-h-screen" style={{ background: "linear-gradient(120deg, #f0f4ff 0%, #e0e7ef 100%)" }}>
      {/* Toast Message */}
      {toast.message && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Interest Delete Confirmation Modal */}
      {deleteInterest.clientIdx !== null &&
        deleteInterest.principalIdx !== null &&
        deleteInterest.interestIdx !== null && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-xs">
              <div className="mb-4 text-lg font-semibold">Are you sure to delete this interest?</div>
              <div className="flex justify-end gap-2">
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={handleCancelDeleteInterest}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  onClick={handleConfirmDeleteInterest}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Client Delete Confirmation Modal */}
      {deleteIdx !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-xs">
            <div className="mb-4 text-lg font-semibold">Are you sure to delete this client?</div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={handleConfirmDelete}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Principal Delete Confirmation Modal */}
      {deletePrincipal.clientIdx !== null && deletePrincipal.principalIdx !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-xs">
            <div className="mb-4 text-lg font-semibold">Are you sure to delete this principal?</div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={handleCancelDeletePrincipal}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={handleConfirmDeletePrincipal}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Filters --- */}
      <div className="mb-8 flex flex-wrap gap-4 items-end bg-white/90 rounded-xl shadow-lg p-4 border border-blue-200">
        <div>
          <label className="block text-blue-900 font-semibold mb-1" htmlFor="filter-name">Name</label>
          <input
            id="filter-name"
            name="name"
            type="text"
            className="border p-2 rounded w-40"
            value={filters.name}
            onChange={handleFilterChange}
            placeholder="Search Name"
          />
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1" htmlFor="filter-place">Place</label>
          <select
            id="filter-place"
            name="place"
            className="border p-2 rounded w-32"
            value={filters.place}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {places.map(place => (
              <option key={place} value={place}>{place}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1" htmlFor="filter-zone">Zone</label>
          <select
            id="filter-zone"
            name="zone"
            className="border p-2 rounded w-32"
            value={filters.zone}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1" htmlFor="filter-clientStatus">Client Status</label>
          <select
            id="filter-clientStatus"
            name="clientStatus"
            className="border p-2 rounded w-32"
            value={filters.clientStatus}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {clientStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1" htmlFor="filter-principalTerm">Principal Term</label>
          <select
            id="filter-principalTerm"
            name="principalTerm"
            className="border p-2 rounded w-32"
            value={filters.principalTerm}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {principalTerms.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1" htmlFor="filter-principalStatus">Principal Status</label>
          <select
            id="filter-principalStatus"
            name="principalStatus"
            className="border p-2 rounded w-32"
            value={filters.principalStatus}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {principalStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1" htmlFor="filter-interestStatus">Interest Status</label>
          <select
            id="filter-interestStatus"
            name="interestStatus"
            className="border p-2 rounded w-32"
            value={filters.interestStatus}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {interestStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
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
        <div className="flex items-end">
          <button
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded shadow hover:from-blue-600 hover:to-indigo-600 transition"
            onClick={handleDownloadPDF}
          >
            Download PDF
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-blue-800 tracking-wide">Clients</h2>
      <div className="overflow-x-auto rounded-xl shadow-lg border border-blue-200" style={{ background: "#F7FAFC" }}>
        <table className="min-w-full border-collapse">
          <thead>
            <tr className={`${headerColor}`}>
              <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px] rounded-tl-xl">ClientID</th>
              <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">Name</th>
              <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">MobileNumber</th>
              <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">Place</th>
              <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">Address</th>
              <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">Zone</th>
              <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px]">Status</th>
              <th className="px-4 py-2 border-b border-indigo-300 border border-[0.5px] rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.map((client, idx) => {
              const globalIdx = (currentPage - 1) * rowsPerPage + idx;
              return (
                <React.Fragment key={globalIdx}>
                  {editIndex === globalIdx ? (
                    <tr className="bg-blue-50 border-b border-indigo-300">
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">{client.ClientID}</td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                        <input
                          className="w-full border p-1 rounded"
                          name="Name"
                          value={editForm.Name}
                          onChange={handleEditInputChange}
                        />
                      </td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                        <input
                          className="w-full border p-1 rounded"
                          name="MobileNumber"
                          value={editForm.MobileNumber}
                          onChange={handleEditInputChange}
                        />
                      </td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                        <input
                          className="w-full border p-1 rounded"
                          name="Place"
                          value={editForm.Place}
                          onChange={handleEditInputChange}
                        />
                      </td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                        <input
                          className="w-full border p-1 rounded"
                          name="Address"
                          value={editForm.Address}
                          onChange={handleEditInputChange}
                        />
                      </td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                        <select
                          className="w-full border p-1 rounded"
                          name="Zone"
                          value={editForm.Zone}
                          onChange={handleEditInputChange}
                        >
                          <option value="">Select Zone</option>
                          {zoneOptions.map(zone => (
                            <option key={zone} value={zone}>{zone}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                        <select
                          className="w-full border p-1 rounded"
                          name="Status"
                          value={editForm.Status}
                          onChange={handleEditInputChange}
                        >
                          <option value="Open">Open</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                        <button
                          className="bg-blue-600 text-white px-2 py-1 rounded mr-2"
                          onClick={() => handleUpdate(globalIdx)}
                        >
                          Update
                        </button>
                        <button
                          className="bg-gray-400 text-white px-2 py-1 rounded"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      className="cursor-pointer hover:bg-blue-100 transition border-b border-blue-100"
                      onClick={() => handleRowClick(globalIdx)}
                    >
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">{client.ClientID}</td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">{client.Name}</td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">{client.MobileNumber}</td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">{client.Place}</td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">{client.Address}</td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">{client.Zone}</td>
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">{client.Status}</td>
                      {/* <td className="px-4 py-2 border-indigo-300 border border-[0.5px]" onClick={e => e.stopPropagation()}>
                        <button
                          className="text-blue-600 hover:underline mr-2"
                          onClick={() => handleEdit(globalIdx)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => handleDelete(globalIdx)}
                        >
                          Delete
                        </button>
                      </td> */}
                      <td className="px-4 py-2 border-indigo-300 border border-[0.5px]">
                        <button
                          className="text-blue-600 hover:underline mr-2"
                          onClick={e => {
                            e.stopPropagation();
                            handleEdit(globalIdx);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(globalIdx);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )}
                  {expandedRow === globalIdx && (
                    <tr>
                      <td colSpan={8} className="bg-blue-50 border-b border-blue-100">
                        <div className="p-4">
                          <h4 className="font-semibold mb-2 text-indigo-700">Principal Details</h4>
                          {/* Principal Table */}
                          {/*<div className="overflow-x-auto rounded-lg shadow border border-indigo-200 bg-white/90">*/}
                          <div
                            className="overflow-x-auto rounded-lg shadow border border-indigo-200"
                            style={{ backgroundColor: "#C5CAE9" }}
                          >
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className={`${headerColor}`}>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px] rounded-tl-md">PrincipalID</th>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">PrincipalAmount (Rs.)</th>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">StartDate</th>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">Term</th>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">InterestAmount (Rs.)</th>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">Remarks</th>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">Status</th>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">ClosedDate</th>
                                  <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px] rounded-tr-md">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(client.principals || []).map((principal, pidx) => (
                                  <React.Fragment key={pidx}>
                                    {editPrincipal.clientIdx === globalIdx && editPrincipal.principalIdx === pidx ? (
                                      <tr className="bg-indigo-50 border-b border-indigo-200">
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.PrincipalID}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                          <input
                                            type="number"
                                            className="w-full border p-1 rounded"
                                            name="PrincipalAmount"
                                            value={editPrincipalForm.PrincipalAmount}
                                            onChange={handleEditPrincipalInputChange}
                                          />
                                        </td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                          <input
                                            type="date"
                                            className="w-full border p-1 rounded"
                                            name="StartDate"
                                            value={editPrincipalForm.StartDate}
                                            onChange={handleEditPrincipalInputChange}
                                          />
                                        </td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                          <select
                                            className="w-full border p-1 rounded"
                                            name="Term"
                                            value={editPrincipalForm.Term}
                                            onChange={handleEditPrincipalInputChange}
                                          >
                                            <option value="1">1</option>
                                            <option value="3">3</option>
                                          </select>
                                        </td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                          <input
                                            type="number"
                                            className="w-full border p-1 rounded"
                                            name="InterestAmount"
                                            value={editPrincipalForm.InterestAmount}
                                            onChange={handleEditPrincipalInputChange}
                                          />
                                        </td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                          <input
                                            className="w-full border p-1 rounded"
                                            name="Remarks"
                                            value={editPrincipalForm.Remarks}
                                            onChange={handleEditPrincipalInputChange}
                                          />
                                        </td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                          <select
                                            className="w-full border p-1 rounded"
                                            name="Status"
                                            value={editPrincipalForm.Status}
                                            onChange={handleEditPrincipalInputChange}
                                          >
                                            <option value="Open">Open</option>
                                            <option value="Closed">Closed</option>
                                          </select>
                                        </td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                          <input
                                            type="date"
                                            className="w-full border p-1 rounded"
                                            name="ClosedDate"
                                            value={editPrincipalForm.ClosedDate}
                                            onChange={handleEditPrincipalInputChange}
                                          />
                                        </td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                          <button
                                            className="bg-blue-600 text-white px-2 py-1 rounded mr-2"
                                            onClick={handleUpdatePrincipal}
                                          >
                                            Update
                                          </button>
                                          <button
                                            className="bg-gray-400 text-white px-2 py-1 rounded"
                                            onClick={handleCancelEditPrincipal}
                                          >
                                            Cancel
                                          </button>
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr
                                        className="cursor-pointer hover:bg-indigo-100 transition border-b border-indigo-200"
                                        onClick={e => {
                                          e.stopPropagation();
                                          handlePrincipalRowClick(globalIdx, pidx);
                                        }}
                                      >
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.PrincipalID}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.PrincipalAmount}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.StartDate}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.Term}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.InterestAmount}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.Remarks}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.Status}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{principal.ClosedDate}</td>
                                        <td className="px-2 py-1 border-indigo-300 border border-[0.5px]" onClick={e => e.stopPropagation()}>
                                          <button
                                            className="text-blue-600 hover:underline mr-2"
                                            onClick={() => handleEditPrincipal(globalIdx, pidx)}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            className="text-red-600 hover:underline"
                                            onClick={() => handleDeletePrincipal(globalIdx, pidx)}
                                          >
                                            Delete
                                          </button>
                                        </td>
                                      </tr>
                                    )}
                                    {/* Interest Table */}
                                    {expandedPrincipal[globalIdx] === pidx && (
                                      <tr>
                                        <td colSpan={10} className="bg-purple-50 border-b border-purple-200">
                                          <div className="p-3">
                                            <h5 className="font-semibold mb-2 text-purple-700">Interest Details</h5>
                                            {/*<div className="overflow-x-auto rounded-md shadow border border-purple-200 bg-white/90">*/}
                                            <div
                                              className="overflow-x-auto rounded-md shadow border border-purple-200"
                                              style={{ backgroundColor: "#FFCC80" }}
                                            >

                                              <table className="min-w-full border-collapse">
                                                <thead>
                                                  <tr className={`${headerColor}`}>
                                                    <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px] rounded-tl-md">InterestID</th>
                                                    <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">InterestReceived (Rs.)</th>
                                                    <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">InterestReceivedDate</th>
                                                    <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">InterestMonth</th>
                                                    <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px]">Status</th>
                                                    <th className="px-2 py-1 border-b border-indigo-300 border border-[0.5px] rounded-tr-md">Actions</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {(principal.interests || []).map((interest, iidx) => (
                                                    <React.Fragment key={iidx}>
                                                      {editInterest.clientIdx === globalIdx &&
                                                      editInterest.principalIdx === pidx &&
                                                      editInterest.interestIdx === iidx ? (
                                                        <tr className="bg-purple-100 border-b border-purple-200">
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{interest.InterestID}</td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                                            <input
                                                              type="number"
                                                              className="w-full border p-1 rounded"
                                                              name="InterestReceived"
                                                              value={editInterestForm.InterestReceived}
                                                              onChange={handleEditInterestInputChange}
                                                            />
                                                          </td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                                            <input
                                                              type="date"
                                                              className="w-full border p-1 rounded"
                                                              name="InterestReceivedDate"
                                                              value={editInterestForm.InterestReceivedDate}
                                                              onChange={handleEditInterestInputChange}
                                                            />
                                                          </td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                                            <input
                                                              type="month"
                                                              className="w-full border p-1 rounded"
                                                              name="InterestMonth"
                                                              value={editInterestForm.InterestMonth}
                                                              onChange={handleEditInterestInputChange}
                                                            />
                                                          </td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                                            <select
                                                              className="w-full border p-1 rounded"
                                                              name="Status"
                                                              value={editInterestForm.Status}
                                                              onChange={handleEditInterestInputChange}
                                                            >
                                                              <option value="Received">Received</option>
                                                              <option value="Pending">Pending</option>
                                                            </select>
                                                          </td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                                            <button
                                                              className="bg-blue-600 text-white px-2 py-1 rounded mr-2"
                                                              onClick={handleUpdateInterest}
                                                            >
                                                              Update
                                                            </button>
                                                            <button
                                                              className="bg-gray-400 text-white px-2 py-1 rounded"
                                                              onClick={handleCancelEditInterest}
                                                            >
                                                              Cancel
                                                            </button>
                                                          </td>
                                                        </tr>
                                                      ) : (
                                                        <tr className="hover:bg-purple-100 transition border-b border-purple-200">
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{interest.InterestID}</td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{interest.InterestReceived}</td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{interest.InterestReceivedDate}</td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                                            {(interest.InterestMonth || "").slice(0, 7)}
                                                          </td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">{interest.Status}</td>
                                                          <td className="px-2 py-1 border-indigo-300 border border-[0.5px]">
                                                            <button
                                                              className="text-blue-600 hover:underline mr-2"
                                                              onClick={() => handleEditInterest(globalIdx, pidx, iidx)}
                                                            >
                                                              Edit
                                                            </button>
                                                            <button
                                                              className="text-red-600 hover:underline"
                                                              onClick={() => handleDeleteInterest(globalIdx, pidx, iidx)}
                                                            >
                                                              Delete
                                                            </button>
                                                          </td>
                                                        </tr>
                                                      )}
                                                    </React.Fragment>
                                                  ))}
                                                  {(!principal.interests || principal.interests.length === 0) && (
                                                    <tr>
                                                      <td colSpan={6} className="text-center text-gray-400 py-2 border border-[0.5px]">
                                                        No interest data available.
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                                <tfoot>
                                                  <tr>
                                                    <td colSpan={1} className="text-right font-semibold px-4 py-2 border-t border-blue-200">
                                                      Total Interest Received:
                                                    </td>
                                                    <td className="font-semibold px-4 py-2 border-t border-blue-200">
                                                      {getPrincipalInterestReceivedTotal(principal).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                                    </td>
                                                  </tr>
                                                </tfoot>
                                              </table>
                                            </div>
                                            {/* Add Interest Button */}
                                            <div className="mt-2">
                                              <button
                                                className="bg-gradient-to-r from-purple-400 to-indigo-400 text-white px-4 py-2 rounded shadow hover:from-purple-500 hover:to-indigo-500 transition"
                                                onClick={() =>
                                                  setIsAddInterestOpen({ clientIdx: globalIdx, principalIdx: pidx })
                                                }
                                              >
                                                + Add Interest
                                              </button>
                                            </div>
                                            {/* Add Interest Modal */}
                                            {isAddInterestOpen.clientIdx === globalIdx &&
                                              isAddInterestOpen.principalIdx === pidx && (
                                                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                                                  <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                                                    <h3 className="text-lg font-bold mb-4">Add Interest</h3>
                                                    <div className="space-y-3">
                                                      <div>
                                                        <label className="block font-medium mb-1" htmlFor="InterestReceived">Interest Received</label>
                                                        <input
                                                          id="InterestReceived"
                                                          type="number"
                                                          className="w-full border p-2 rounded"
                                                          name="InterestReceived"
                                                          value={addInterestForm.InterestReceived}
                                                          onChange={handleAddInterestInputChange}
                                                        />
                                                        {!addInterestForm.InterestReceived && (
                                                          <div className="text-red-600 text-sm mt-1">Interest Received required</div>
                                                        )}
                                                      </div>
                                                      <div>
                                                        <label className="block font-medium mb-1" htmlFor="InterestReceivedDate">Interest Received Date</label>
                                                        <input
                                                          id="InterestReceivedDate"
                                                          type="date"
                                                          className="w-full border p-2 rounded"
                                                          name="InterestReceivedDate"
                                                          value={addInterestForm.InterestReceivedDate}
                                                          onChange={handleAddInterestInputChange}
                                                        />
                                                        {!addInterestForm.InterestReceivedDate && (
                                                          <div className="text-red-600 text-sm mt-1">Interest Received Date required</div>
                                                        )}
                                                      </div>
                                                      <div>
                                                        <label className="block font-medium mb-1" htmlFor="InterestMonth">Interest Month</label>
                                                        <input
                                                          id="InterestMonth"
                                                          type="month"
                                                          className="w-full border p-2 rounded"
                                                          name="InterestMonth"
                                                          value={addInterestForm.InterestMonth}
                                                          onChange={handleAddInterestInputChange}
                                                          required
                                                        />
                                                        {!addInterestForm.InterestMonth && (
                                                          <div className="text-red-600 text-sm mt-1">Interest Month required</div>
                                                        )}
                                                      </div>
                                                      <div>
                                                        <label className="block font-medium mb-1" htmlFor="Status">Status</label>
                                                        <select
                                                          id="Status"
                                                          className="w-full border p-2 rounded"
                                                          name="Status"
                                                          value={addInterestForm.Status}
                                                          onChange={handleAddInterestInputChange}
                                                        >
                                                          <option value="">Select Status</option>
                                                          <option value="Received">Received</option>
                                                          <option value="Pending">Pending</option>
                                                        </select>
                                                        {!addInterestForm.Status && (
                                                          <div className="text-red-600 text-sm mt-1">Status required</div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2 mt-4">
                                                      <button
                                                        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                                                        onClick={() => setIsAddInterestOpen({ clientIdx: null, principalIdx: null })}
                                                      >
                                                        Cancel
                                                      </button>
                                                      <button
                                                        className={`px-4 py-2 rounded ${
                                                          addInterestForm.InterestReceived &&
                                                          addInterestForm.InterestReceivedDate &&
                                                          addInterestForm.Status &&
                                                          addInterestForm.InterestMonth
                                                            ? "bg-green-600 text-white hover:bg-green-700"
                                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        }`}
                                                        onClick={handleAddInterest}
                                                        disabled={
                                                          !addInterestForm.InterestReceived ||
                                                          !addInterestForm.InterestReceivedDate ||
                                                          !addInterestForm.Status ||
                                                          !addInterestForm.InterestMonth
                                                        }
                                                      >
                                                        Add
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))}
                                {(!client.principals || client.principals.length === 0) && (
                                  <tr>
                                    <td colSpan={10} className="text-center text-gray-400 py-2 border border-[0.5px]">
                                      No principal data available.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan={1} className="text-right font-semibold px-4 py-2 border-t border-blue-200">
                                    Total Principal Amount:
                                  </td>
                                  <td className="font-semibold px-4 py-2 border-t border-blue-200">
                                    {getClientPrincipalTotal(client).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                  </td>
                                  <td colSpan={2} className="text-right font-semibold px-4 py-2 border-t border-blue-200">
                                    Total Interest Amount to be received as of {getCurrentMonth()}:
                                  </td>
                                  <td className="font-semibold px-4 py-2 border-t border-blue-200">
                                    {getClientInterestTotal(client).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                  </td>
                                  <td colSpan={2} className="text-right font-semibold px-4 py-2 border-t border-blue-200">
                                    Total Interest Received:
                                  </td>
                                  <td className="font-semibold px-4 py-2 border-t border-blue-200">
                                    {getClientInterestReceivedTotal(client).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                  </td>
                                  {/* ...other total columns if needed... */}
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          {/* Add Principal Button */}
                          <div className="mt-2">
                            <button
                              className="bg-gradient-to-r from-indigo-400 to-blue-400 text-white px-4 py-2 rounded shadow hover:from-indigo-500 hover:to-blue-500 transition"
                              onClick={() => setIsAddPrincipalOpen({ clientIdx: globalIdx })}
                            >
                              + Add Principal
                            </button>
                          </div>
                          {/* Add Principal Modal */}
                          {isAddPrincipalOpen.clientIdx === globalIdx && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                              <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                                <h3 className="text-lg font-bold mb-4">Add Principal</h3>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block font-medium mb-1" htmlFor="PrincipalAmount">Principal Amount</label>
                                    <input
                                      id="PrincipalAmount"
                                      type="number"
                                      className="w-full border p-2 rounded"
                                      name="PrincipalAmount"
                                      value={addPrincipalForm.PrincipalAmount}
                                      onChange={handleAddPrincipalInputChange}
                                    />
                                    {!addPrincipalForm.PrincipalAmount && (
                                      <div className="text-red-600 text-sm mt-1">Principal Amount required</div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block font-medium mb-1" htmlFor="StartDate">Start Date</label>
                                    <input
                                      id="StartDate"
                                      type="date"
                                      className="w-full border p-2 rounded"
                                      name="StartDate"
                                      value={addPrincipalForm.StartDate}
                                      onChange={handleAddPrincipalInputChange}
                                    />
                                    {!addPrincipalForm.StartDate && (
                                      <div className="text-red-600 text-sm mt-1">Start Date required</div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block font-medium mb-1" htmlFor="Term">Term</label>
                                    <select
                                      id="Term"
                                      className="w-full border p-2 rounded"
                                      name="Term"
                                      value={addPrincipalForm.Term}
                                      onChange={handleAddPrincipalInputChange}
                                    >
                                      <option value="">Select Term</option>
                                      <option value="1">1</option>
                                      <option value="3">3</option>
                                    </select>
                                    {!addPrincipalForm.Term && (
                                      <div className="text-red-600 text-sm mt-1">Term required</div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block font-medium mb-1" htmlFor="InterestAmount">Interest Amount</label>
                                    <input
                                      id="InterestAmount"
                                      type="number"
                                      className="w-full border p-2 rounded"
                                      name="InterestAmount"
                                      value={addPrincipalForm.InterestAmount}
                                      onChange={handleAddPrincipalInputChange}
                                    />
                                    {!addPrincipalForm.InterestAmount && (
                                      <div className="text-red-600 text-sm mt-1">Interest Amount required</div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block font-medium mb-1" htmlFor="Remarks">Remarks</label>
                                    <input
                                      id="Remarks"
                                      className="w-full border p-2 rounded"
                                      name="Remarks"
                                      value={addPrincipalForm.Remarks}
                                      onChange={handleAddPrincipalInputChange}
                                    />
                                    {!addPrincipalForm.Remarks && (
                                      <div className="text-red-600 text-sm mt-1">Remarks required</div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block font-medium mb-1" htmlFor="Status">Status</label>
                                    <select
                                      id="Status"
                                      className="w-full border p-2 rounded"
                                      name="Status"
                                      value={addPrincipalForm.Status}
                                      onChange={handleAddPrincipalInputChange}
                                    >
                                      <option value="">Select Status</option>
                                      <option value="Open">Open</option>
                                      <option value="Closed">Closed</option>
                                    </select>
                                    {!addPrincipalForm.Status && (
                                      <div className="text-red-600 text-sm mt-1">Status required</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                  <button
                                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                                    onClick={() => setIsAddPrincipalOpen({ clientIdx: null })}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className={`px-4 py-2 rounded ${
                                      addPrincipalForm.PrincipalAmount &&
                                      addPrincipalForm.StartDate &&
                                      addPrincipalForm.Term &&
                                      addPrincipalForm.InterestAmount &&
                                      addPrincipalForm.Remarks &&
                                      addPrincipalForm.Status
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                    onClick={handleAddPrincipal}
                                    disabled={
                                      !addPrincipalForm.PrincipalAmount ||
                                      !addPrincipalForm.StartDate ||
                                      !addPrincipalForm.Term ||
                                      !addPrincipalForm.InterestAmount ||
                                      !addPrincipalForm.Remarks ||
                                      !addPrincipalForm.Status
                                    }
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-start">
        <button
          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded shadow hover:from-blue-600 hover:to-indigo-600 transition"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Client
        </button>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span className="font-semibold text-blue-800">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          className="px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Client</h3>
            {/* Add Client Modal */}
            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1" htmlFor="Name">Name</label>
                <input
                  id="Name"
                  className="w-full border p-2 rounded"
                  name="Name"
                  value={form.Name}
                  onChange={handleInputChange}
                />
                {formErrors.Name && (
                  <div className="text-red-600 text-sm mt-1">{formErrors.Name}</div>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1" htmlFor="MobileNumber">Mobile Number</label>
                <input
                  id="MobileNumber"
                  className="w-full border p-2 rounded"
                  name="MobileNumber"
                  value={form.MobileNumber}
                  onChange={handleInputChange}
                />
                {formErrors.MobileNumber && (
                  <div className="text-red-600 text-sm mt-1">{formErrors.MobileNumber}</div>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1" htmlFor="Place">Place</label>
                <input
                  id="Place"
                  className="w-full border p-2 rounded"
                  name="Place"
                  value={form.Place}
                  onChange={handleInputChange}
                />
                {formErrors.Place && (
                  <div className="text-red-600 text-sm mt-1">{formErrors.Place}</div>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1" htmlFor="Address">Address</label>
                <input
                  id="Address"
                  className="w-full border p-2 rounded"
                  name="Address"
                  value={form.Address}
                  onChange={handleInputChange}
                />
                {formErrors.Address && (
                  <div className="text-red-600 text-sm mt-1">{formErrors.Address}</div>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1" htmlFor="Zone">Zone</label>
                <select
                  id="Zone"
                  className="w-full border p-2 rounded"
                  name="Zone"
                  value={form.Zone}
                  onChange={handleInputChange}
                >
                  <option value="">Select Zone</option>
                  {zoneOptions.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
                {formErrors.Zone && (
                  <div className="text-red-600 text-sm mt-1">{formErrors.Zone}</div>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1" htmlFor="Status">Status</label>
                <select
                  id="Status"
                  className="w-full border p-2 rounded"
                  name="Status"
                  value={form.Status}
                  onChange={handleInputChange}
                >
                  <option value="">Select Status</option>
                  <option value="Open">Open</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Closed">Closed</option>
                </select>
                {formErrors.Status && (
                  <div className="text-red-600 text-sm mt-1">{formErrors.Status}</div>
                )}
              </div>
            </div> 
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() => {
                  setIsModalOpen(false);
                  setFormErrors({
                    Name: "",
                    MobileNumber: "",
                    Place: "",
                    Address: "",
                    Zone: "",
                    Status: "",
                  });
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  isFormValid()
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                onClick={handleAddClient}
                disabled={!isFormValid()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;