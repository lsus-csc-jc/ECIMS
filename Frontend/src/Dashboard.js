// src/Dashboard.js
import React from 'react';
import './dashboard.css';

const Dashboard = ({ token, onLogout }) => {
  return (
    <>
      {/* SVG Definitions – Consider moving these to public/index.html if used globally */}
      <svg xmlns="http://www.w3.org/2000/svg" className="d-none">
        <symbol id="circle-half" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 0 8 1v14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" />
        </symbol>
        <symbol id="moon-stars-fill" viewBox="0 0 16 16">
          <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
          <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z" />
        </symbol>
        <symbol id="sun-fill" viewBox="0 0 16 16">
          <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
        </symbol>
        {/* Additional symbols can be added here */}
      </svg>

      {/* Header */}
      <header
        className="navbar sticky-top flex-md-nowrap p-0 shadow"
        style={{ backgroundColor: 'rgb(30,55,85)' }}
        data-bs-theme="dark"
      >
        <a
          className="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-4 text-white"
          href="/dashboard"
        >
          ECIMS
        </a>
        <ul className="navbar-nav flex-row d-md-none">
          <li className="nav-item text-nowrap">
            <button
              className="nav-link px-3 text-white"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebarMenu"
              aria-controls="sidebarMenu"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <svg className="bi">
                <use href="#list" />
              </svg>
            </button>
          </li>
        </ul>
      </header>

      {/* Sidebar and Main Content */}
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <nav className="sidebar border border-right col-md-3 col-lg-2 p-0 bg-body-tertiary">
            <div
              className="offcanvas-md offcanvas-end bg-body-tertiary"
              tabIndex="-1"
              id="sidebarMenu"
              aria-labelledby="sidebarMenuLabel"
            >
              <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="sidebarMenuLabel">
                  ECIMS
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="offcanvas"
                  data-bs-target="#sidebarMenu"
                  aria-label="Close"
                ></button>
              </div>
              <div className="offcanvas-body d-md-flex flex-column p-0 pt-lg-3 overflow-y-auto">
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <a
                      className="nav-link d-flex align-items-center gap-2 active"
                      aria-current="page"
                      href="/dashboard"
                      data-page="dashboard.html"
                    >
                      <svg className="bi">
                        <use href="#house-fill" />
                      </svg>
                      Dashboard
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link d-flex align-items-center gap-2"
                      href="/invmanagement"
                      data-page="invmanagement.html"
                    >
                      <svg className="bi">
                        <use href="#file-earmark" />
                      </svg>
                      Inventory Management
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link d-flex align-items-center gap-2"
                      href="/orders"
                      data-page="orders.html"
                    >
                      <svg className="bi">
                        <use href="#cart" />
                      </svg>
                      Orders
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link d-flex align-items-center gap-2"
                      href="/suppliers"
                      data-page="suppliers.html"
                    >
                      <svg className="bi">
                        <use href="#people" />
                      </svg>
                      Suppliers
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link d-flex align-items-center gap-2"
                      href="/reports"
                      data-page="reports.html"
                    >
                      <svg className="bi">
                        <use href="#graph-up" />
                      </svg>
                      Reports
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link d-flex align-items-center gap-2"
                      href="/changelog"
                      data-page="changelog.html"
                    >
                      <svg className="bi">
                        <use href="#puzzle" />
                      </svg>
                      Change Log
                    </a>
                  </li>
                </ul>
                <hr className="my-3" />
                <ul className="nav flex-column mb-auto">
                  <li className="nav-item">
                    <a
                      className="nav-link d-flex align-items-center gap-2"
                      href="/settings"
                      data-page="settings.html"
                    >
                      <svg className="bi">
                        <use href="#gear-wide-connected" />
                      </svg>
                      Settings
                    </a>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className="nav-link d-flex align-items-center gap-2 btn btn-link"
                      onClick={onLogout}
                    >
                      <svg className="bi">
                        <use href="#door-closed" />
                      </svg>
                      Sign out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h1 className="h2">Dashboard</h1>
            </div>
            <div className="container mt-4">
              <div className="row text-center">
                <div className="col-md-4">
                  <div className="card border-primary shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">Products</h5>
                      <p className="display-4" id="total-products">0</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-warning shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">Stock Alerts</h5>
                      <p className="display-4" id="total-alerts">0</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-danger shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">Pending Orders</h5>
                      <p className="display-4" id="pending-orders">0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
