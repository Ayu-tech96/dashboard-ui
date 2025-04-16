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

// Mock user database (in production, use a real backend)
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

  // Initialize default data
  const initializeDefaultData = () => {
    const defaultRows = [
      "Delhi", "Kolkata", "Mumbai", "Hyderabad",
      "Bangalore", "Jaipur", "Ahmedabad", "Lucknow", "Pune"
    ];
    const defaultCols = [
      "Equipment Type", "Equipment Received", "Glow", "Slow",
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
  const { rowLabels = [], colLabels = [], data = [] } = dashboardData[activeTab] || {};

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
  };

  // Check if user has admin privileges
  const isAdmin = () => currentUser?.role === "admin";

  // Protected data manipulation functions
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

  // Selection functions
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

  // Export functions (available to all users)
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
    const input = document.querySelector(".table-wrapper");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "pt", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, width - 20, height);
      pdf.save(`${activeTab}_dashboard.pdf`);
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
        </div>
      </div>

      {/* Equipment Tabs */}
      <div className="equipment-tabs">
        {EQUIPMENT_TABS.map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab);
              setSelectedRowIdx(null);
              setSelectedRows([]);
              setSelectedCols([]);
            }}
          >
            {tab}
          </button>
        ))}
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
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="corner-cell">
                {isAdmin() && showAdvancedTools && (
                  <input
                    type="checkbox"
                    checked={selectedRows.length === rowLabels.length && rowLabels.length > 0}
                    onChange={toggleAllRows}
                  />
                )}
                Station
              </th>
              {colLabels.map((label, colIdx) => (
                <th key={colIdx} className="col-header">
                  <div className="flex items-center">
                    {isAdmin() && showAdvancedTools && (
                      <input
                        type="checkbox"
                        checked={selectedCols.includes(colIdx)}
                        onChange={() => toggleColSelection(colIdx)}
                        className="mr-1"
                      />
                    )}
                    <input
                      className={`header-input ${!isAdmin() ? 'read-only' : ''}`}
                      value={label}
                      onChange={(e) => updateColLabel(colIdx, e.target.value)}
                      readOnly={!isAdmin()}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((city, rowIdx) => (
              <tr key={rowIdx}>
                <th className="row-header">
                  <div className="flex items-center">
                    {isAdmin() && showAdvancedTools && (
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowIdx)}
                        onChange={() => toggleRowSelection(rowIdx)}
                        className="mr-1"
                      />
                    )}
                    <input
                      className={`header-inputt ${!isAdmin() ? 'read-only' : ''}`}
                      value={city}
                      onChange={(e) => updateRowLabel(rowIdx, e.target.value)}
                      readOnly={!isAdmin()}
                    />
                    <div className="row-header-buttons">
                      <button 
                        className="select-btn" 
                        onClick={() => setSelectedRowIdx(rowIdx)}
                      >
                        📊
                      </button>
                      {isAdmin() && (
                        <button 
                          className="delete-btn"
                          onClick={() => deleteRow(rowIdx)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </th>
                {colLabels.map((_, colIdx) => {
                  const { status, value } = data[rowIdx]?.[colIdx] || defaultCell();
                  return (
                    <td key={colIdx} className={`data-cell status-${status.toLowerCase()}`}>
                      <div className="cell-wrapper">
                        {isAdmin() && showAdvancedTools && (
                          <select
                            className="status-dropdown"
                            value={status}
                            onChange={(e) => updateStatus(rowIdx, colIdx, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          className={`text-entry ${!isAdmin() ? 'read-only' : ''}`}
                          value={value}
                          onChange={(e) => updateValue(rowIdx, colIdx, e.target.value)}
                          placeholder="Data"
                          style={{ fontSize: `${Math.max(10, 18 - value.length / 2)}px` }}
                          readOnly={!isAdmin()}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts - Available to all users */}
      <h2 style={{ marginTop: "20px" }}>Status Overview</h2>
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

      {selectedRowIdx !== null && (
        <div style={{ marginTop: "20px" }}>
          <h2>Status Distribution: {rowLabels[selectedRowIdx]}</h2>
          <PieChart width={800} height={300}>
            <Pie
              data={getPieChartData()}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              labelLine={false}
            >
              {getPieChartData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[entry.name]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => {
                const total = getPieChartData().reduce((sum, item) => sum + item.value, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return [`${value} (${percentage}%)`, name];
              }}
            />
            <Legend />
          </PieChart>
        </div>
      )}
    </div>
  );
}

export default App;