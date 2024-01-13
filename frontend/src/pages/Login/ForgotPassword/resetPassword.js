import React, { useState } from "react";
import { resetPassword } from "../../../api/user";
import { useParams } from "react-router-dom";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
export default function ResetPassword() {
  const [isLoading, setLoading] = useState(false);
  let { reset_token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [validPassword, setValidPassword] = useState(true);

  const updatePasswordFunction = async () => {
    try {
      setLoading(true);
      const passwordAlertText = document.getElementById("password-alert-text");

      if (newPassword !== confirmNewPassword) {
        setValidPassword(false);
        passwordAlertText.innerHTML = "Passwords do not match.";

      } else {
        setValidPassword(true);
        const data = {
          passwordResetToken: reset_token,
          newPassword: newPassword,
          confirmNewPassword: confirmNewPassword,
        };
        const response = await resetPassword(data);
        if (response.status === 200) {
          alert("Password updated successfully");
          window.location.href = "/login";
        } else {
          setValidPassword(false);
          passwordAlertText.innerHTML = "Invalid Password";
        }
      }
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };
  return (
    <div className="order-md-1 text-start">
      <h3 className="text-center mb-3">Lấy Mật Khẩu</h3>
      <div
        className={`alert alert-danger my-2 d-flex align-items-center font-weight-bold ${
          !validPassword ? "d-block" : "d-none"
        }`}
      >
        <PriorityHighIcon className="me-2"></PriorityHighIcon>
        <div className="" id="password-alert-text"></div>
      </div>

      <div className="   ">
        <div className="mb-3">
          <label htmlFor="address">Mật khẩu mới</label>
          <input
            type="password"
            className="form-control"
            id="newPassword"
            placeholder="***********"
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <div className="invalid-feedback">
            Please enter your new password.
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="address">Xác nhận mật khẩu</label>
          <input
            type="password"
            className="form-control"
            id="confirmNewPassword"
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="***********"
            required
          />
          <div className="invalid-feedback">
            Please enter your new password.
          </div>
        </div>

        <button
          className="w-100 btn btn-warning btn-lg btn-block d-flex align-items-center justify-content-center "
          type="submit"
          onClick={(event) => {
            event.preventDefault();
            updatePasswordFunction();
          }}
          disabled={isLoading}
        >
                  <span
          className={`spinner-border spinner-border-sm ${
            isLoading ? "d-block" : "d-none"
          }`}
          role="status"
          aria-hidden="true"
        ></span>
          Cập nhật
          
        </button>
      </div>
    </div>
  );
}
