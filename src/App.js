import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import { saveToDB, loadFromDB } from './db';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import "./custom.css";

const STATUS_OPTIONS = ["NotStarted", "InProgress", "Completed"];
const defaultCell = () => ({ status: "NotStarted", value: "" });
const EQUIPMENT_TABS = ["ILS", "DVOR", "HPDME", "LPDME", "NDB", "VHF"];

// Mock user database
const USERS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user", password: "user123", role: "user" }
];

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  
// Dashboard state
  const [showTourConsole, setShowTourConsole] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  
  // Employee database state
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    employeeId: '',
    name: '',
    designation: '',
    contactNumber: '',
    basicPay: ''
  });
  
  // Tour management state
  const [tourRecords, setTourRecords] = useState([]);
  const [currentTour, setCurrentTour] = useState({
    city: '',
    equipment: '',
    selectedEmployees: [],
    startDate: '',
    endDate: '',
    status: 'Upcoming'
  });
  
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'asc' });
  const [filterValues, setFilterValues] = useState({
    city: '',
    equipment: '',
    status: ''
  });

  const [showPieChartModal, setShowPieChartModal] = useState(false);
  const [activeTab, setActiveTab] = useState(EQUIPMENT_TABS[0]);
  const [dashboardData, setDashboardData] = useState({});
  const [selectedRowIdx, setSelectedRowIdx] = useState(null);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [swapRow1, setSwapRow1] = useState(0);
  const [swapRow2, setSwapRow2] = useState(0);
  const [swapCol1, setSwapCol1] = useState(0);
  const [swapCol2, setSwapCol2] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [graphVisibility, setGraphVisibility] = useState({
    overview: false,
    station: false
  });

 const [columnFilters, setColumnFilters] = useState({});
 




  // Initialize default data
  const initializeDefaultData = () => {
    const defaultRows = [
      "Delhi", "Kolkata", "Mumbai", "Hyderabad",
      "Bangalore", "Jaipur", "Ahmedabad", "Lucknow", "Pune"
    ];
    const defaultCols = [
      "Make/Model", "Region", "Glow", "Slow",
      "Physical Installation", "Optimization", "FIU Calibration",
      "Handing Over", "Car Submission"
    ];
    const defaultData = Array.from({ length: defaultRows.length }, () =>
      Array.from({ length: defaultCols.length }, () => defaultCell())
    );

    return EQUIPMENT_TABS.reduce((acc, tab) => {
      acc[tab] = {
        rowLabels: [...defaultRows],
        colLabels: [...defaultCols],
        data: JSON.parse(JSON.stringify(defaultData))
      };
      return acc;
    }, {});
  };

  // Filter data based on column filters
const filterData = (data) => {
  const activeFilters = Object.entries(columnFilters).filter(([_, value]) => value.trim() !== '');
  
  if (activeFilters.length === 0) return data.map((row, index) => ({ row, originalIndex: index }));

  return data
    .map((row, index) => ({ row, originalIndex: index }))
    .filter(({ row }) => {
      return activeFilters.every(([colIdx, filterValue]) => {
        const cellValue = row[colIdx]?.value?.toString().toLowerCase() || '';
        return cellValue.includes(filterValue.toLowerCase().trim());
      });
    });
};

  // Handle filter changes
  const handleFilterChange = (columnIndex, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setColumnFilters({});
  };

  // Get current tab data
  const { rowLabels = [], colLabels = [], data = [] } = dashboardData[activeTab] || {};

  // Filter the data for display
  const filteredData = filterData(data);




  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedRowIdx(null);
    setSelectedRows([]);
    setSelectedCols([]);
    setGraphVisibility({
      overview: false,
      station: false
    });
	 setColumnFilters({});
  };

  // Login function
  const handleLogin = (username, password) => {
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      setLoginError("");
      // Initialize or load data after successful login
      const loadData = async () => {
        const savedData = await loadFromDB("dashboardData");
        if (savedData) {
          setDashboardData(savedData);
        } else {
          const defaultData = initializeDefaultData();
          setDashboardData(defaultData);
          await saveToDB("dashboardData", defaultData);
        }
      };
      loadData();
    } else {
      setLoginError("Invalid username or password");
    }
  };

  // Logout function
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setDashboardData({});
  };

  // Get current tab data
 {/* const { rowLabels = [], colLabels = [], data = [] } = dashboardData[activeTab] || {};*/}

  // Save data changes
  useEffect(() => {
    if (isAuthenticated && Object.keys(dashboardData).length > 0) {
      saveToDB("dashboardData", dashboardData);
    }
  }, [dashboardData, isAuthenticated]);

  // Update current tab's data
  const updateCurrentTabData = (newData) => {
    setDashboardData(prev => ({
      ...prev,
      [activeTab]: newData
    }));

// Sample employee data
    const sampleEmployees = [
      {
        employeeId: 'EMP001',
        name: 'John Doe',
        designation: 'Field Engineer',
        contactNumber: '9876543210',
        basicPay: '50000'
      },
      {
        employeeId: 'EMP002',
        name: 'Jane Smith',
        designation: 'Senior Engineer',
        contactNumber: '9876543211',
        basicPay: '65000'
      }
    ];
    
    setEmployees(sampleEmployees);
    
    // Sample tour records
    const sampleTours = [
      {
        id: '1',
        city: 'Mumbai',
        equipment: 'X-ray Machine',
        employeeIds: ['EMP001'],
        startDate: '2023-06-01',
        endDate: '2023-06-10',
        status: 'Completed'
      }
    ];
    
    setTourRecords(sampleTours);

  };


 // Employee management handlers
  const handleEmployeeInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({ ...newEmployee, [name]: value });
  };

  const addEmployee = () => {
    if (!newEmployee.employeeId || !newEmployee.name) return;
    
    setEmployees([...employees, newEmployee]);
    setNewEmployee({
      employeeId: '',
      name: '',
      designation: '',
      contactNumber: '',
      basicPay: ''
    });
  };

  const deleteEmployee = (employeeId) => {
    setEmployees(employees.filter(emp => emp.employeeId !== employeeId));
  };

  // Tour management handlers
  const handleTourInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTour({ ...currentTour, [name]: value });
  };

  const toggleEmployeeSelection = (employeeId) => {
    setCurrentTour(prev => {
      if (prev.selectedEmployees.includes(employeeId)) {
        return {
          ...prev,
          selectedEmployees: prev.selectedEmployees.filter(id => id !== employeeId)
        };
      } else {
        return {
          ...prev,
          selectedEmployees: [...prev.selectedEmployees, employeeId]
        };
      }
    });
  };

  const submitTourRecord = () => {
    if (!currentTour.city || !currentTour.equipment || currentTour.selectedEmployees.length === 0) {
      alert('Please fill all required fields');
      return;
    }
    
    const newTour = {
      id: Date.now().toString(),
      city: currentTour.city,
      equipment: currentTour.equipment,
      employeeIds: currentTour.selectedEmployees,
      startDate: currentTour.startDate,
      endDate: currentTour.endDate,
      status: currentTour.status
    };
    
    setTourRecords([...tourRecords, newTour]);
    setCurrentTour({
      city: '',
      equipment: '',
      selectedEmployees: [],
      startDate: '',
      endDate: '',
      status: 'Upcoming'
    });
  };

  // Get city statistics
  const getCityStats = () => {
    const stats = {};
    tourRecords.forEach(record => {
      if (!stats[record.city]) {
        stats[record.city] = {
          upcoming: 0,
          onTour: 0,
          completed: 0,
          total: 0
        };
      }
      stats[record.city][record.status.toLowerCase().replace(' ', '')]++;
      stats[record.city].total++;
    });
    return stats;
  };

  // Get filtered and sorted tour records
  const getFilteredRecords = () => {
    let result = [...tourRecords];
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    // Apply filters
    if (filterValues.city) {
      result = result.filter(record => 
        record.city.toLowerCase().includes(filterValues.city.toLowerCase())
      );
    }
    if (filterValues.equipment) {
      result = result.filter(record => 
        record.equipment.toLowerCase().includes(filterValues.equipment.toLowerCase())
      );
    }
    if (filterValues.status) {
      result = result.filter(record => record.status === filterValues.status);
    }
    
    return result;
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ... (keep all your existing functions like handleLogin, handleLogout, etc.)







  // Check if user has admin privileges
  const isAdmin = () => currentUser?.role === "admin";

  // Data manipulation functions (same as before)
  const updateStatus = (row, col, newStatus) => {
    if (!isAdmin()) return;
    const updated = [...data];
    updated[row][col] = { ...updated[row][col], status: newStatus };
    updateCurrentTabData({
      rowLabels,
      colLabels,
      data: updated
    });
  };

  const updateValue = (row, col, newValue) => {
    if (!isAdmin()) return;
    const updated = [...data];
    updated[row][col] = { ...updated[row][col], value: newValue };
    updateCurrentTabData({
      rowLabels,
      colLabels,
      data: updated
    });
  };

  const updateRowLabel = (index, value) => {
    if (!isAdmin()) return;
    const updated = [...rowLabels];
    updated[index] = value;
    updateCurrentTabData({
      rowLabels: updated,
      colLabels,
      data
    });
  };

  const updateColLabel = (index, value) => {
    if (!isAdmin()) return;
    const updated = [...colLabels];
    updated[index] = value;
    updateCurrentTabData({
      rowLabels,
      colLabels: updated,
      data
    });
  };

  const addRow = () => {
    if (!isAdmin()) return;
    const newRowLabels = [...rowLabels, `Site ${rowLabels.length + 1}`];
    const newData = [...data, Array.from({ length: colLabels.length }, () => defaultCell())];
    updateCurrentTabData({
      rowLabels: newRowLabels,
      colLabels,
      data: newData
    });
  };

  const addColumn = () => {
    if (!isAdmin()) return;
    const newColLabels = [...colLabels, `Parameter ${colLabels.length + 1}`];
    const newData = data.map(row => [...row, defaultCell()]);
    updateCurrentTabData({
      rowLabels,
      colLabels: newColLabels,
      data: newData
    });
  };

  const deleteRow = (index) => {
    if (!isAdmin() || data.length <= 1) return;
    const newRowLabels = rowLabels.filter((_, i) => i !== index);
    const newData = data.filter((_, i) => i !== index);
    updateCurrentTabData({
      rowLabels: newRowLabels,
      colLabels,
      data: newData
    });
    if (selectedRowIdx === index) setSelectedRowIdx(null);
    setSelectedRows(selectedRows.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const deleteColumn = (index) => {
    if (!isAdmin() || colLabels.length <= 1) return;
    const newColLabels = colLabels.filter((_, i) => i !== index);
    const newData = data.map(row => row.filter((_, i) => i !== index));
    updateCurrentTabData({
      rowLabels,
      colLabels: newColLabels,
      data: newData
    });
    setSelectedCols(selectedCols.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const swapRows = (index1, index2) => {
    if (!isAdmin() || index1 < 0 || index2 < 0 || index1 >= data.length || index2 >= data.length) return;
    const newRowLabels = [...rowLabels];
    const newData = [...data];
    [newRowLabels[index1], newRowLabels[index2]] = [newRowLabels[index2], newRowLabels[index1]];
    [newData[index1], newData[index2]] = [newData[index2], newData[index1]];
    updateCurrentTabData({
      rowLabels: newRowLabels,
      colLabels,
      data: newData
    });
  };

  const swapColumns = (index1, index2) => {
    if (!isAdmin() || index1 < 0 || index2 < 0 || index1 >= colLabels.length || index2 >= colLabels.length) return;
    const newColLabels = [...colLabels];
    const newData = data.map(row => {
      const newRow = [...row];
      [newRow[index1], newRow[index2]] = [newRow[index2], newRow[index1]];
      return newRow;
    });
    [newColLabels[index1], newColLabels[index2]] = [newColLabels[index2], newColLabels[index1]];
    updateCurrentTabData({
      rowLabels,
      colLabels: newColLabels,
      data: newData
    });
  };

  // Selection functions (same as before)
  const toggleAllRows = (e) => {
    if (!isAdmin()) return;
    if (e.target.checked) {
      setSelectedRows(rowLabels.map((_, i) => i));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleAllCols = (e) => {
    if (!isAdmin()) return;
    if (e.target.checked) {
      setSelectedCols(colLabels.map((_, i) => i));
    } else {
      setSelectedCols([]);
    }
  };

  const toggleRowSelection = (index) => {
    if (!isAdmin()) return;
    setSelectedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const toggleColSelection = (index) => {
    if (!isAdmin()) return;
    setSelectedCols(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const deleteSelectedRows = () => {
    if (!isAdmin() || selectedRows.length === 0) return;
    const newRowLabels = rowLabels.filter((_, i) => !selectedRows.includes(i));
    const newData = data.filter((_, i) => !selectedRows.includes(i));
    updateCurrentTabData({
      rowLabels: newRowLabels,
      colLabels,
      data: newData
    });
    setSelectedRows([]);
    if (selectedRows.includes(selectedRowIdx)) setSelectedRowIdx(null);
  };

  const deleteSelectedColumns = () => {
    if (!isAdmin() || selectedCols.length === 0) return;
    const newColLabels = colLabels.filter((_, i) => !selectedCols.includes(i));
    const newData = data.map(row => row.filter((_, i) => !selectedCols.includes(i)));
    updateCurrentTabData({
      rowLabels,
      colLabels: newColLabels,
      data: newData
    });
    setSelectedCols([]);
  };

  // Export functions (same as before)
  const exportToExcel = () => {
    const sheetData = [
      ["Station", ...colLabels],
      ...data.map((row, rIdx) => [rowLabels[rIdx], ...row.map(cell => cell.value)])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, `${activeTab}_dashboard.xlsx`);
  };

 const exportToPDF = () => {
  // Try multiple selectors to find the table
  const selectors = ['.table-scroll-container', '.frozen-table', '.dashboard-container table'];
  let input = null;
  
  for (const selector of selectors) {
    input = document.querySelector(selector);
    if (input) break;
  }

  if (!input) {
    alert('Could not find table element for PDF generation');
    return;
  }

  // Temporary show any hidden elements
  const originalStyles = {};
  const elements = input.querySelectorAll('*');
  elements.forEach(el => {
    originalStyles[el] = el.style.visibility;
    el.style.visibility = 'visible';
  });

  html2canvas(input, {
    scale: 2,
    logging: true,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: input.scrollWidth,
    windowHeight: input.scrollHeight
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'pt', [
      input.scrollWidth,
      input.scrollHeight
    ]);
    
    pdf.addImage(imgData, 'PNG', 0, 0, input.scrollWidth, input.scrollHeight);
    pdf.save(`${activeTab}_dashboard.pdf`);
    
    // Restore original styles
    elements.forEach(el => {
      if (originalStyles[el] !== undefined) {
        el.style.visibility = originalStyles[el];
      }
    });
  }).catch(err => {
    console.error('PDF generation error:', err);
    alert('Failed to generate PDF. See console for details.');
    
    // Ensure styles are restored even on error
    elements.forEach(el => {
      if (originalStyles[el] !== undefined) {
        el.style.visibility = originalStyles[el];
      }
    });
  });
};

  // Chart data
  const chartData = colLabels.map((label, colIdx) => {
    const count = { NotStarted: 0, InProgress: 0, Completed: 0 };
    data.forEach(row => count[row[colIdx]?.status]++);
    return {
      name: label,
      NotStarted: count.NotStarted,
      InProgress: count.InProgress,
      Completed: count.Completed,
    };
  });

  const getPieChartData = () => {
    if (selectedRowIdx === null || selectedRowIdx >= data.length) return [];
    
    const count = { NotStarted: 0, InProgress: 0, Completed: 0 };
    data[selectedRowIdx].forEach(cell => {
      if (cell?.status in count) {
        count[cell.status]++;
      }
    });

    const total = Object.values(count).reduce((sum, val) => sum + val, 0);
    return Object.entries(count).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }));
  };

  const pieColors = {
    NotStarted: "#f87171",
    InProgress: "#60a5fa",
    Completed: "#34d399"
  };


 

 // Modify the exportChartAsImage function to not use modalRef
  const exportChartAsImage = () => {
    const chartElement = document.querySelector('.pie-chart-modal .recharts-wrapper');
    if (chartElement) {
      html2canvas(chartElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${rowLabels[selectedRowIdx]}_status_chart.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };


  const ColumnFilter = React.memo(({ columnIndex, columnLabel, data, filterValue, onFilterChange }) => {
  // Get unique values for this column
  const uniqueValues = React.useMemo(() => {
    const values = data.map(row => row[columnIndex]?.value?.toString().trim() || '');
    return [...new Set(values)].filter(val => val !== '');
  }, [data, columnIndex]);

  return (
    <div className="column-filter">
      <input
        type="text"
        placeholder={`Filter ${columnLabel}`}
        value={filterValue}
        onChange={(e) => onFilterChange(columnIndex, e.target.value)}
        className="filter-input"
      />
      {uniqueValues.length > 0 && (
        <select
          className="filter-select"
          onChange={(e) => onFilterChange(columnIndex, e.target.value)}
          value={filterValue}
        >
          <option value="">All</option>
          {uniqueValues.map((value, i) => (
            <option key={i} value={value}>{value}</option>
          ))}
        </select>
      )}
    </div>
  );
});




  // Render login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>RCDU Dashboard Login</h2>
          {loginError && <div className="login-error">{loginError}</div>}
          <form onSubmit={(e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;
            handleLogin(username, password);
          }}>
            <div className="form-group">
              <label>Username:</label>
              <input type="text" name="username" required />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input type="password" name="password" required />
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </div>
    );
  }

 // Render dashboard if authenticated
  return (
    <div className="dashboard-container">
      {/* Dashboard Header with Logout */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">RCDU Project Dashboard</h1>
        <div className="user-info">
       
          <span>Logged in as: {currentUser.username} ({currentUser.role})</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
       {/*   <span>Logged in as: {currentUser.username} ({currentUser.role})</span>*/}

         {/* <button onClick={handleLogout} className="logout-button">Logout</button>*/}

        </div>
      </div>

      {/* Equipment Tabs */}
      <div className="equipment-tabs">
        {EQUIPMENT_TABS.map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
 <div className="equipment-tabss">
          <button 
            onClick={() => setShowTourConsole(true)} 
            className="tour-console-button"
          >
            Tour Management
          </button>
 </div>

      </div>

      {/* Equipment Title */}
      <h2 className="equipment-title">{activeTab} Equipment Dashboard</h2>

      {/* Advanced Tools Toggle - Only for admin */}
      {isAdmin() && (
        <div className="p-4">
          <button
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            className="m-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {showAdvancedTools ? "Hide Tools ☰" : "Show Tools ☰"}
          </button>

          {showAdvancedTools && (
            <div className="tools-panel">
              {/* Filter Controls */}
              <div className="tools-row">
                <div className="tool-group">
                  <button onClick={clearAllFilters} className="btn-clear-filters">
                    Clear Filters
                  </button>
                  <span className="filter-count">
                    Showing {filteredData.length} of {data.length} rows
                  </span>
                </div>
              </div>

              <div className="tools-row">
                <div className="tool-group">
                  <button onClick={addRow} className="btn-add">+ Row</button>
                  <button onClick={addColumn} className="btn-add">+ Column</button>
                </div>
                <div className="tool-group">
                  <button onClick={exportToExcel} className="btn-export">Excel</button>
                  <button onClick={exportToPDF} className="btn-export">PDF</button>
                </div>
              </div>

              <div className="tools-row compact">
                <div className="tool-group">
                  <span>Swap Rows:</span>
                  <select value={swapRow1} onChange={e => setSwapRow1(Number(e.target.value))}>
                    {rowLabels.map((label, i) => <option key={i} value={i}>{label}</option>)}
                  </select>
                  <select value={swapRow2} onChange={e => setSwapRow2(Number(e.target.value))}>
                    {rowLabels.map((label, i) => <option key={i} value={i}>{label}</option>)}
                  </select>
                  <button onClick={() => swapRows(swapRow1, swapRow2)} className="btn-swap">↔</button>
                </div>

                <div className="tool-group">
                  <span>Swap Columns:</span>
                  <select value={swapCol1} onChange={e => setSwapCol1(Number(e.target.value))}>
                    {colLabels.map((label, i) => <option key={i} value={i}>{label}</option>)}
                  </select>
                  <select value={swapCol2} onChange={e => setSwapCol2(Number(e.target.value))}>
                    {colLabels.map((label, i) => <option key={i} value={i}>{label}</option>)}
                  </select>
                  <button onClick={() => swapColumns(swapCol1, swapCol2)} className="btn-swap">↔</button>
                </div>
              </div>

              <div className="tools-row">
                <div className="tool-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedRows.length === rowLabels.length && rowLabels.length > 0}
                      onChange={toggleAllRows}
                    />
                    Select All Rows
                  </label>
                  <button 
                    onClick={deleteSelectedRows} 
                    className="btn-delete"
                    disabled={selectedRows.length === 0}
                  >
                    Delete ({selectedRows.length})
                  </button>
                </div>

                <div className="tool-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedCols.length === colLabels.length && colLabels.length > 0}
                      onChange={toggleAllCols}
                    />
                    Select All Columns
                  </label>
                  <button 
                    onClick={deleteSelectedColumns} 
                    className="btn-delete"
                    disabled={selectedCols.length === 0}
                  >
                    Delete ({selectedCols.length})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export buttons for all users */}
      <div className="export-buttons">
        <button onClick={exportToExcel} className="btn-export">Export to Excel</button>
        <button onClick={exportToPDF} className="btn-export">Export to PDF</button>
      </div>





     {/* Main Table */}
<div className="table-container">
  <table className="frozen-table">
    {/* Column Headers */}
    <thead>
      <tr>
        <th className="corner-cell">
          {isAdmin() && showAdvancedTools && (
            <div className="header-checkbox">
              <input
                type="checkbox"
                checked={selectedRows.length === rowLabels.length && rowLabels.length > 0}
                onChange={toggleAllRows}
              />
            </div>
          )}
          Station
        </th>
        {/* First 9 columns */}
        {colLabels.slice(0, 9).map((label, colIdx) => (
          <th key={colIdx} className="col-header">
            <div className="header-content">
              <input
                className={`header-input ${!isAdmin() ? 'read-only' : ''}`}
                value={label}
                onChange={(e) => updateColLabel(colIdx, e.target.value)}
                readOnly={!isAdmin()}
              />
              {isAdmin() && showAdvancedTools && (
                <div className="col-header-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCols.includes(colIdx)}
                    onChange={() => toggleColSelection(colIdx)}
                  />
                </div>
              )}
            </div>
            {isAdmin() && showAdvancedTools && (
              <ColumnFilter
                columnIndex={colIdx}
                columnLabel={label}
                data={data}
                filterValue={columnFilters[colIdx] || ''}
                onFilterChange={handleFilterChange}
              />
            )}
          </th>
        ))}
        {/* Additional columns (10+) */}
        {colLabels.length > 9 && colLabels.slice(9).map((label, colIdx) => {
          const actualIndex = colIdx + 9;
          return (
            <th key={actualIndex} className="col-header">
              <div className="header-content">
                <input
                  className={`header-input ${!isAdmin() ? 'read-only' : ''}`}
                  value={label}
                  onChange={(e) => updateColLabel(actualIndex, e.target.value)}
                  readOnly={!isAdmin()}
                />
                {isAdmin() && showAdvancedTools && (
                  <div className="col-header-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCols.includes(actualIndex)}
                      onChange={() => toggleColSelection(actualIndex)}
                    />
                  </div>
                )}
              </div>
              {isAdmin() && showAdvancedTools && (
                <ColumnFilter
                  columnIndex={actualIndex}
                  columnLabel={label}
                  data={data}
                  filterValue={columnFilters[actualIndex] || ''}
                  onFilterChange={handleFilterChange}
                />
              )}
            </th>
          );
        })}
      </tr>
    </thead>

    {/* Row Data */}
    <tbody>
      {/* First 9 rows */}
      {filteredData.slice(0, 9).map(({ row, originalIndex }) => (
        <tr key={`${originalIndex}-${rowLabels[originalIndex]}`}>
          <th className="row-header">
            <input
              className={`header-input ${!isAdmin() ? 'read-only' : ''}`}
              value={rowLabels[originalIndex]}
              onChange={(e) => updateRowLabel(originalIndex, e.target.value)}
              readOnly={!isAdmin()}
            />
            {isAdmin() && showAdvancedTools && (
              <div className="row-header-checkbox">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(originalIndex)}
                  onChange={() => toggleRowSelection(originalIndex)}
                />
              </div>
            )}
            <div className="row-header-buttons">
              <button 
                className="select-btn" 
                onClick={() => {
                  setSelectedRowIdx(originalIndex);
                  setShowPieChartModal(true);
                }}
                title="View detailed status chart"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M10 20V10M14 20V4M18 20V14M6 20V16" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </th>
          {/* First 9 columns */}
          {row.slice(0, 9).map((cell, colIdx) => (
            <td key={colIdx} className={`data-cell status-${cell.status.toLowerCase()}`}>
              <div className="cell-wrapper">
                <input
                  type="text"
                  className={`text-entry ${!isAdmin() ? 'read-only' : ''}`}
                  value={cell.value}
                  onChange={(e) => updateValue(originalIndex, colIdx, e.target.value)}
                  placeholder="Data"
                  style={{ fontSize: `${Math.max(10, 18 - cell.value.length / 2)}px` }}
                  readOnly={!isAdmin()}
                />
                {isAdmin() && showAdvancedTools && (
                  <div className="status-dropdown-container">
                    <select
                      className="status-dropdown"
                      value={cell.status}
                      onChange={(e) => updateStatus(originalIndex, colIdx, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </td>
          ))}
          {/* Additional columns (10+) */}
          {row.length > 9 && row.slice(9).map((cell, colIdx) => (
            <td key={colIdx + 9} className={`data-cell status-${cell.status.toLowerCase()}`}>
              <div className="cell-wrapper">
                <input
                  type="text"
                  className={`text-entry ${!isAdmin() ? 'read-only' : ''}`}
                  value={cell.value}
                  onChange={(e) => updateValue(originalIndex, colIdx + 9, e.target.value)}
                  placeholder="Data"
                  style={{ fontSize: `${Math.max(10, 18 - cell.value.length / 2)}px` }}
                  readOnly={!isAdmin()}
                />
                {isAdmin() && showAdvancedTools && (
                  <div className="status-dropdown-container">
                    <select
                      className="status-dropdown"
                      value={cell.status}
                      onChange={(e) => updateStatus(originalIndex, colIdx + 9, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </td>
          ))}
        </tr>
      ))}
      {/* Additional rows (10+) */}
      {filteredData.length > 9 && filteredData.slice(9).map(({ row, originalIndex }) => (
        <tr key={`${originalIndex}-${rowLabels[originalIndex]}`}>
          <th className="row-header">
            <input
              className={`header-input ${!isAdmin() ? 'read-only' : ''}`}
              value={rowLabels[originalIndex]}
              onChange={(e) => updateRowLabel(originalIndex, e.target.value)}
              readOnly={!isAdmin()}
            />
            {isAdmin() && showAdvancedTools && (
              <div className="row-header-checkbox">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(originalIndex)}
                  onChange={() => toggleRowSelection(originalIndex)}
                />
              </div>
            )}
            <div className="row-header-buttons">
              <button 
                className="select-btn" 
                onClick={() => {
                  setSelectedRowIdx(originalIndex);
                  setShowPieChartModal(true);
                }}
                title="View detailed status chart"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M10 20V10M14 20V4M18 20V14M6 20V16" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </th>
          {row.map((cell, colIdx) => (
            <td key={colIdx} className={`data-cell status-${cell.status.toLowerCase()}`}>
              <div className="cell-wrapper">
                <input
                  type="text"
                  className={`text-entry ${!isAdmin() ? 'read-only' : ''}`}
                  value={cell.value}
                  onChange={(e) => updateValue(originalIndex, colIdx, e.target.value)}
                  placeholder="Data"
                  style={{ fontSize: `${Math.max(10, 18 - cell.value.length / 2)}px` }}
                  readOnly={!isAdmin()}
                />
                {isAdmin() && showAdvancedTools && (
                  <div className="status-dropdown-container">
                    <select
                      className="status-dropdown"
                      value={cell.status}
                      onChange={(e) => updateStatus(originalIndex, colIdx, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
      {/* Charts Section with Toggle Controls */}
      <div className="charts-section">
        <div className="chart-controls">
          <button 
            onClick={() => setGraphVisibility(prev => ({...prev, overview: !prev.overview}))}
            className={`chart-toggle-btn ${graphVisibility.overview ? 'active' : ''}`}
          >
            {graphVisibility.overview ? '▼ Overview Chart' : '► Overview Chart'}
          </button>
          {/*
          {selectedRowIdx !== null && (
            <button 
              onClick={() => setGraphVisibility(prev => ({...prev, station: !prev.station}))}
              className={`chart-toggle-btn ${graphVisibility.station ? 'active' : ''}`}
            >
              {graphVisibility.station ? '▼ Station Chart' : '► Station Chart'}
            </button>
          )}*/}
        </div>

        {graphVisibility.overview && (
          <div className="chart-container">
            <h3>Status Overview</h3>
		<h4>Total Stations</h4>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="NotStarted" stackId="a" fill="#8884d8" />
                  <Bar dataKey="InProgress" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="Completed" stackId="a" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedRowIdx !== null && showPieChartModal && (
          <div className="modal-overlay" onClick={() => setShowPieChartModal(false)}>
            <div className="pie-chart-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <span className="station-name">{rowLabels[selectedRowIdx]}</span>
                  <span className="status-distribution">Status Distribution</span>
                </h2>
                <button 
                  className="close-modal"
                  onClick={() => setShowPieChartModal(false)}
                  aria-label="Close modal"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              
              <div className="chart-container">
                <PieChart width={800} height={400}>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    innerRadius={75}
                    paddingAngle={1}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                    animationBegin={200}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={pieColors[entry.name]} 
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => {
                      const total = getPieChartData().reduce((sum, item) => sum + item.value, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return [`${value} (${percentage}%)`, name];
                    }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ paddingLeft: '30px' }}
                    iconSize={12}
                    iconType="circle"
                  />
                </PieChart>
              </div>

              <div className="modal-footer">
                <button 
                  className="export-btn"
                  onClick={exportChartAsImage}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Export as Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>








  {/* Enhanced Tour Management Console Modal */}
      {showTourConsole && (
        <div className="modal-overlay" onClick={() => setShowTourConsole(false)}>
          <div className="tour-console-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tour Management Console</h2>
              <div className="header-actions">
                <button 
                  className="manage-employees-button"
                  onClick={() => setShowEmployeeModal(true)}
                >
                  Manage Employees
                </button>
                <button 
                  className="close-modal"
                  onClick={() => setShowTourConsole(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="tour-console-content">
              {/* City Statistics */}
              <div className="city-stats-section">
                <h3>Current Deployment Status by City</h3>
                <div className="stats-grid">
                  {Object.entries(getCityStats()).map(([city, stats]) => (
                    <div key={city} className="city-stat-card">
                      <h4>{city}</h4>
                      <div>Total: {stats.total}</div>
                      <div>Upcoming: {stats.upcoming}</div>
                      <div>On Tour: {stats.onTour}</div>
                      <div>Completed: {stats.completed}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Tour Section */}
              <div className="add-tour-section">
                <h3>Create New Tour</h3>
                <div className="tour-form">
                  <div className="form-row">
                    <label>City:</label>
                    <input
                      type="text"
                      name="city"
                      value={currentTour.city}
                      onChange={handleTourInputChange}
                      placeholder="Enter city name"
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Equipment:</label>
                    <input
                      type="text"
                      name="equipment"
                      value={currentTour.equipment}
                      onChange={handleTourInputChange}
                      placeholder="Enter equipment name"
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Select Team Members:</label>
                    <div className="employee-selection">
                      {employees.map(employee => (
                        <div key={employee.employeeId} className="employee-checkbox">
                          <input
                            type="checkbox"
                            id={`emp-${employee.employeeId}`}
                            checked={currentTour.selectedEmployees.includes(employee.employeeId)}
                            onChange={() => toggleEmployeeSelection(employee.employeeId)}
                          />
                          <label htmlFor={`emp-${employee.employeeId}`}>
                            {employee.name} ({employee.designation})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <label>Start Date:</label>
                    <input
                      type="date"
                      name="startDate"
                      value={currentTour.startDate}
                      onChange={handleTourInputChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>End Date:</label>
                    <input
                      type="date"
                      name="endDate"
                      value={currentTour.endDate}
                      onChange={handleTourInputChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Status:</label>
                    <select
                      name="status"
                      value={currentTour.status}
                      onChange={handleTourInputChange}
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="On Tour">On Tour</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={submitTourRecord}
                    className="submit-tour-button"
                  >
                    Create Tour
                  </button>
                </div>
              </div>

              {/* Tour Records Table */}
              <div className="tour-records-section">
                <h3>Tour Records</h3>
                
                {/* Filters */}
                <div className="tour-filters">
                  <input
                    type="text"
                    placeholder="Filter by city"
                    value={filterValues.city}
                    onChange={(e) => setFilterValues({...filterValues, city: e.target.value})}
                  />
                  
                  <input
                    type="text"
                    placeholder="Filter by equipment"
                    value={filterValues.equipment}
                    onChange={(e) => setFilterValues({...filterValues, equipment: e.target.value})}
                  />
                  
                  <select
                    value={filterValues.status}
                    onChange={(e) => setFilterValues({...filterValues, status: e.target.value})}
                  >
                    <option value="">All Statuses</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="On Tour">On Tour</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                
                <div className="tour-table-container">
                  <table className="tour-records-table">
                    <thead>
                      <tr>
                        <th onClick={() => requestSort('city')}>City</th>
                        <th onClick={() => requestSort('equipment')}>Equipment</th>
                        <th>Team Members</th>
                        <th onClick={() => requestSort('startDate')}>Start Date</th>
                        <th onClick={() => requestSort('endDate')}>End Date</th>
                        <th onClick={() => requestSort('status')}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredRecords().map(record => (
                        <tr key={record.id}>
                          <td>{record.city}</td>
                          <td>{record.equipment}</td>
                          <td>
                            <ul className="team-members-list">
                              {record.employeeIds.map(empId => {
                                const employee = employees.find(e => e.employeeId === empId);
                                return employee ? (
                                  <li key={empId}>
                                    {employee.name} ({employee.designation})
                                  </li>
                                ) : null;
                              })}
                            </ul>
                          </td>
                          <td>{new Date(record.startDate).toLocaleDateString()}</td>
                          <td>{record.endDate ? new Date(record.endDate).toLocaleDateString() : 'N/A'}</td>
                          <td className={`status-${record.status.replace(' ', '').toLowerCase()}`}>
                            {record.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Management Modal */}
      {showEmployeeModal && (
        <div className="modal-overlay" onClick={() => setShowEmployeeModal(false)}>
          <div className="employee-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Employee Database</h2>
              <button 
                className="close-modal"
                onClick={() => setShowEmployeeModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="employee-modal-content">
              {/* Add New Employee */}
              <div className="add-employee-section">
                <h3>Add New Employee</h3>
                <div className="employee-form">
                  <div className="form-row">
                    <label>Employee ID:</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={newEmployee.employeeId}
                      onChange={handleEmployeeInputChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={newEmployee.name}
                      onChange={handleEmployeeInputChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Designation:</label>
                    <input
                      type="text"
                      name="designation"
                      value={newEmployee.designation}
                      onChange={handleEmployeeInputChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Contact Number:</label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={newEmployee.contactNumber}
                      onChange={handleEmployeeInputChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Basic Pay:</label>
                    <input
                      type="text"
                      name="basicPay"
                      value={newEmployee.basicPay}
                      onChange={handleEmployeeInputChange}
                    />
                  </div>
                  
                  <button onClick={addEmployee} className="add-employee-button">
                    Add Employee
                  </button>
                </div>
              </div>

              {/* Employee List */}
              <div className="employee-list-section">
                <h3>Employee Records</h3>
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Contact</th>
                      <th>Basic Pay</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee.employeeId}>
                        <td>{employee.employeeId}</td>
                        <td>{employee.name}</td>
                        <td>{employee.designation}</td>
                        <td>{employee.contactNumber}</td>
                        <td>{employee.basicPay}</td>
                        <td>
                          <button 
                            onClick={() => deleteEmployee(employee.employeeId)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default App;
