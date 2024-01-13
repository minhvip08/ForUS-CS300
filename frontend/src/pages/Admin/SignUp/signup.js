import { signup } from "../../../api/admin";
import { useState } from "react";

import { Input, Ripple, initMDB } from "mdb-ui-kit";
import "./signup.css";

initMDB({ Input, Ripple });

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [studentID, setStudentID] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const registerFunction = async () => {
    try {
      // convert dateofbirth to password

      const data = {
        fullname: fullName,
        username: studentID,
        email: email,
        address: address,
        role: role,
        dateOfBirth: dateOfBirth,
      };
      console.log(data);
      const response = await signup(data);
      if (response.status === 200) {
        alert("Registered successfully");
        // window.location.href = "/login";
      } else {
        alert("Error");
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div>
      <meta charSet="utf-8" />
      <link rel="icon" href="/docs/4.0/assets/img/favicons/favicon.ico" />
      <title>Form Tạo người dùng mới</title>

      <div className="py-5 container">
        <div className="order-md-1 text-start">
          <h1 className="mb-3 ">Form Tạo người dùng mới</h1>
          <form className="needs-validation" noValidate>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="firstName">Tên đầy đủ</label>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  required
                  onChange={(e) => setFullName(e.target.value)}
                />
                <div className="invalid-feedback">
                  Mục Tên đầy đủ là bắt buộc.
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="lastName">MSSV</label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  required
                  onChange={(e) => setStudentID(e.target.value)}
                />
                <div className="invalid-feedback">
                  Mục MSSV là bắt buộc.
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="email">Email</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">@</span>
                </div>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  placeholder="you@example.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
                {/* <div className="invalid-feedback">
                Please enter a valid email address for shipping updates.
              </div> */}
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="address">Địa chỉ</label>
              <input
                type="text"
                className="form-control"
                id="address"
                placeholder="1234 Main St"
                required
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="invalid-feedback">Nhập địa chỉ</div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="role">Vai trò</label>
                <select
                  className="custom-select d-block w-100"
                  id="role"
                  required
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value>Choose...</option>
                  <option>Admin</option>
                  <option>User</option>
                </select>
                <div className="invalid-feedback">
                  Please select a valid role.
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="date">Ngày tháng năm sinh</label>
                <input
                  type="date"
                  className="form-control"
                  id="date"
                  placeholder="01/01/2000"
                  required
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
            </div>
            <hr className="mb-4" />

            <button
              className="btn btn-primary btn-lg btn-block"
              type="submit"
              onClick={(event) => {
                event.preventDefault();
                registerFunction();
              }}
            >
              Tạo người dùng
            </button>
          </form>
        </div>

        <footer className="my-5 pt-5 text-muted text-center text-small">
          <p className="mb-1">© 2023-2024 ForUS</p>
        </footer>
      </div>
      {/* Bootstrap core JavaScript
      ================================================== */}
      {/* Placed at the end of the document so the pages load faster */}
    </div>
  );
}
