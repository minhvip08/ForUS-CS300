// import "./profile.css";
import React, { useState, useEffect } from "react";
import "./management.css";
import { ReportCardModal, CreateNotificationModal } from "../../Modal/modal";
import { getAllUsers } from "../../../api/user";
import { getTimePassed } from "../../../utils/getTimePassed";
import { instance } from "../../../api/config";
import { ThreadInformation } from "../../Box/UserControl/usercontrol";
import {
  sendNotificationToUsers,
  sendNotificationToAllUsers,
} from "../../../api/admin";

const UserTable = ({ onSelectedUsersChange }) => {
  const [selectAll, setSelectAll] = useState(false);
  const [checked, setChecked] = useState(Array(0).fill(false));
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        console.log(response);
        // Check if the request was successful (status code 200)
        if (response.status === 200) {
          // Update the state with the received user data
          setUsers(response.data.users);
        } else {
          // Handle other status codes (optional)
          console.error("Error fetching users:", response.statusText);
        }
      } catch (error) {
        // Handle network errors or other exceptions
        console.error("Error fetching users:", error.message);
      }
    };

    // Call the fetchUsers function when the component mounts
    fetchUsers();
  }, []); // The empty dependency array ensures that this effect runs once, similar to componentDidMount

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setChecked(Array(users.length).fill(!selectAll));
    onSelectedUsersChange(selectAll ? [] : users.map((user) => user._id));
  };

  const handleCheckboxChange = (index) => {
    const updatedChecked = [...checked];
    updatedChecked[index] = !updatedChecked[index];
    setChecked(updatedChecked);
    setSelectAll(updatedChecked.every((isChecked) => isChecked));
    onSelectedUsersChange(
      updatedChecked
        .map((isChecked, i) => (isChecked ? users[i]._id : null))
        .filter(Boolean)
    );
  };

  return (
    <table className="table mt-3 table-bordered table-striped table-info justify-content-center">
      <thead className="thead-dark">
        <tr style={{ textAlign: "center" }}>
          <th>ID</th>
          <th>Người dùng</th>
          <th>Username</th>
          <th>Email</th>
          <th>Vai trò</th>
          <th>Truy cập lần cuối</th>
          <th>Trạng thái</th>
          <th>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="selectAllCheckbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user, index) => (
          <tr key={index}>
            <td>{user._id}</td>
            <td>
              <ThreadInformation
                thread={{ author: user }}
                hideTime={true}
                customColor="black"
                target="_blank"
              />
            </td>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{getTimePassed(user.lastAccessed)}</td>
            <td
              className={`align-middle ${
                user.isBanned ? "banned" : "available"
              }`}
            >
              {user.isBanned ? "Bị chặn" : "Bình thường"}
            </td>
            <td className="align-middle">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  value=""
                  id={`flexCheckChecked_${index}`}
                  checked={checked[index]}
                  onChange={() => handleCheckboxChange(index)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ViewDetailsButton = ({ report, onFinish }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        className="btn btn-secondary custom-btn-yellow rounded"
        onClick={() => openModal()}
      >
        <i className="bi bi-info-circle"></i> Chi tiết
      </button>
      {/* Modal */}
      <ReportCardModal
        isOpen={isModalOpen}
        handleClose={() => closeModal()}
        handleDelete={onFinish}
        report={report}
      />
    </>
  );
};

const ReportTable = () => {
  const [data, setData] = useState([]);

  const getReports = async () => {
    try {
      return (await instance.get("/report/-1")).data.reports.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    getReports().then(setData);
  }, []);

  return (
    <>
      <table className="table mt-3 table-striped table-info justify-content-center">
        <thead className="thead-dark">
          <tr style={{ textAlign: "center" }}>
            <th>Thời gian</th>
            <th>Loại</th>
            <th>Đường dẫn</th>
            <th>Nội dung</th>
            <th>Báo cáo bởi</th>
            <th>Công cụ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((report) => {
            const resolveReport = async () => {
              if (!window.confirm("Are you sure to resolve this report?"))
                return;
              try {
                await instance.put("/report/" + report._id);
                alert("Đã xoá báo cáo");
                window.location.search = "?tab=report";
              } catch (e) {
                console.log(e);
              }
            };
            let info = ReportCardModal.generateLink(report);
            return (
              <tr>
                <td>{getTimePassed(Date.parse(report.createdAt))}</td>
                <td>{info.type}</td>
                <td>
                  <a href={info.link} target="_blank">
                    {info.link.replace(/^([^]{20})[^]+$/, "$1...")}
                  </a>
                </td>
                <td>{report.body.replace(/^([^]{20})[^]+/, "$1...")}</td>
                <td>
                  <ThreadInformation
                    thread={{ author: report.reporter }}
                    hideTime={true}
                    customColor="black"
                    target="_blank"
                  />
                </td>
                <td className="align-middle text-center">
                  {/* Second Element: Tools */}
                  <div className="btn-group ms-auto">
                    <ViewDetailsButton
                      report={report}
                      onFinish={resolveReport}
                    />
                    <span className="mx-2"></span>
                    <button
                      className="btn btn-secondary custom-btn-green rounded"
                      onClick={resolveReport}
                    >
                      <i className="bi bi-check-circle"></i> Xoá
                    </button>
                    <span className="mx-2"></span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default function Management() {
  const [activeTab, setActiveTab] = useState(
    new URLSearchParams(window.location.search).get("tab") == "report"
      ? "report"
      : "user"
  );
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSendNotificationModalOpen, setIsSendNotificationModalOpen] =
    useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [recipient, setRecipient] = useState("all");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (window.history.pushState) {
      var newurl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname +
        "?tab=" +
        tab;
      window.history.pushState({ path: newurl }, "", newurl);
    }
  };

  const goToSignUp = () => {
    window.open("/signup", "_blank");
  };

  const handleSelectedUsersChange = (users) => {
    setSelectedUsers(users);
  };

  const handleSendNotification = () => {
    // Use selectedUsers for sending notifications
    console.log("Selected Users:", selectedUsers);
    setIsSendNotificationModalOpen(true);
  };

  const handleSendNotificationConfirm = async () => {
    // Prepare the data for sending notifications
    const notificationData = {
      title: notificationTitle,
      body: notificationBody,
      user_ids: selectedUsers,
      from: "admin",
    };

    // Call the API function to send notifications
    try {
      const response = await (recipient == "all"
        ? sendNotificationToAllUsers
        : sendNotificationToUsers)(notificationData);
      if (response && response.status === 200) {
        alert("Đã gửi thông báo");
        return response;
      } else {
        alert("Gửi thông báo thất bại");
      }
    } catch (error) {
      console.error("Error sending notification:", error.response);
    }

    // Close the modal after sending the notification
    setIsSendNotificationModalOpen(false);
  };

  const handleSendNotificationCancel = () => {
    // Close the modal without sending the notification
    setIsSendNotificationModalOpen(false);
  };

  return (
    <div className="container">
      <link href="form-validation.css" rel="stylesheet" />
      <div className="py-5 container bg-info rounded-3 shadow-sm">
        <div className="bd-example-snippet bd-code-snippet">
          <div className="bd-example m-0 border-0">
            <nav>
              <div className="nav nav-tabs mb-3" id="nav-tab" role="tablist">
                <button
                  className={`nav-link ${
                    activeTab === "user" ? "active" : ""
                  } text-white`}
                  id="nav-home-tab"
                  onClick={() => handleTabClick("user")}
                >
                  Người dùng
                </button>
                {/* 
                <button
                  className={`nav-link ${
                    activeTab === "thread" ? "active" : ""
                  } + text-white`}
                  id="nav-password-tab"
                  onClick={() => handleTabClick("thread")}
                >
                  Threads
                </button> */}

                <button
                  className={`nav-link ${
                    activeTab === "report" ? "active" : ""
                  } text-white`}
                  id="nav-home-tab"
                  onClick={() => handleTabClick("report")}
                >
                  Báo cáo
                </button>
              </div>
            </nav>
            <div className="tab-content" id="nav-tabContent">
              <div
                className={`tab-pane fade ${
                  activeTab === "user" ? "show active" : ""
                }`}
                id="nav-user"
                role="tabpanel"
                aria-labelledby="nav-user-tab"
              >
                <div className="order-md-1 text-start ">
                  <h1 className="mb-3 text-white">Tất cả người dùng</h1>
                  <div className="d-flex flex-column align-items-start">
                    {/* First Element: Search Bar and New User Button */}
                    <div className="d-flex align-items-center">
                      {/* <SearchBar />{" "} */}
                      {/* Replace with your actual SearchBar component */}
                    </div>

                    {/* Second Element: Tools */}
                    <div className="container-fluid mt-3">
                      <div className="d-flex">
                        {/* <select className="form-select me-3 w-auto">
                          <option>Sort by...</option>
                          </select> */}
                        <div className="btn-group ms-auto">
                          <button
                            className="btn btn-secondary custom-btn-yellow rounded"
                            id="newUserBtn"
                            onClick={() => goToSignUp()}
                          >
                            <i className="bi bi-person-plus"></i>
                            Thêm mới
                          </button>
                          <span className="mx-2"></span>

                          <button
                            className="btn btn-secondary custom-btn-blue rounded"
                            id="sendNotificationBtn"
                            onClick={() => handleSendNotification()}
                          >
                            <i className="bi bi-envelope"></i> Gửi Thông báo
                          </button>
                          {/* CreateNotificationModal */}
                          <CreateNotificationModal
                            isOpen={isSendNotificationModalOpen}
                            onCancel={() => handleSendNotificationCancel()}
                            onConfirm={() => handleSendNotificationConfirm()}
                            title={notificationTitle}
                            body={notificationBody}
                            onTitleChange={(e) =>
                              setNotificationTitle(e.target.value)
                            }
                            onBodyChange={(e) =>
                              setNotificationBody(e.target.value)
                            }
                            onRecipientChange={(e) =>
                              setRecipient(e.target.value)
                            }
                          />
                          <span className="mx-2"></span>
                        </div>
                      </div>
                    </div>

                    {/* Third Element: Table */}
                    <UserTable
                      onSelectedUsersChange={handleSelectedUsersChange}
                    />

                    {/* Fourth Element: Pagination Bar
                    <div className="d-flex justify-content-center mt-3">
                      <nav aria-label="Page navigation example">
                        <ul className="pagination">
                          <li className="page-item">
                            <a
                              className="page-link"
                              href="#"
                              aria-label="Previous"
                            >
                              <span aria-hidden="true">&laquo;</span>
                            </a>
                          </li>
                          <li className="page-item">
                            <a className="page-link" href="#">
                              1
                            </a>
                          </li>
                          <li className="page-item">
                            <a className="page-link" href="#" aria-label="Next">
                              <span aria-hidden="true">&raquo;</span>
                            </a>
                          </li>
                        </ul>
                      </nav>
                    </div> */}
                  </div>
                </div>
              </div>
              <div
                className={`tab-pane fade ${
                  activeTab === "report" ? "show active" : ""
                }`}
                id="nav-password"
                role="tabpanel"
                aria-labelledby="nav-password-tab"
              >
                <div className="order-md-1 text-start ">
                  <h1 className="mb-3 text-white">Tất cả báo cáo</h1>

                  <div className="d-flex flex-column align-items-start">
                    {/* First Element: Search Bar and New User Button */}
                    <div className="d-flex align-items-center">
                      {/* <SearchBar />{" "} */}
                      {/* Replace with your actual SearchBar component */}
                      {/* <button className="btn btn-primary ms-3">New User</button> */}
                    </div>

                    {/* Second Element: Tools */}
                    {/*<div className="container-fluid mt-3">
                      <div className="d-flex">
                        <select className="form-select me-3 w-auto">
                          <option>Sort by...</option>
                        </select>
                      </div>
                    </div>*/}

                    {/* Third Element: Table */}
                    <ReportTable />

                    {/* Fourth Element: Pagination Bar */}
                    {/*<div className="d-flex justify-content-center mt-3">
                      <nav aria-label="Page navigation example">
                        <ul className="pagination">
                          <li className="page-item">
                            <a
                              className="page-link"
                              href="#"
                              aria-label="Previous"
                            >
                              <span aria-hidden="true">&laquo;</span>
                            </a>
                          </li>
                          <li className="page-item">
                            <a className="page-link" href="#">
                              1
                            </a>
                          </li>
                          <li className="page-item">
                            <a className="page-link" href="#" aria-label="Next">
                              <span aria-hidden="true">&raquo;</span>
                            </a>
                          </li>
                        </ul>
                      </nav>
                    </div>*/}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
