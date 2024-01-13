import { Link, Navigate, useNavigate } from "react-router-dom";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import { useEffect, useReducer, useState } from "react";
import { login } from "../../api/user";
import { setCookie } from "../../utils/setCookie";
import axios from "axios";
import Logo from "../../components/icons/logo";
import logo from "../../assets/icons/logo.png";

export default function Login() {
  // const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);

  const [valid, setValid] = useState(true);

  const [errorMessage, setErrorMessage] = useState({});

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const Login = async (event) => {
    try {
      event.preventDefault();
      setLoading(true);

      if (
        formData.username.length >= 4 &&
        formData.username.length <= 20 &&
        formData.password.length >= 4 &&
        formData.password.length <= 20
      ) {

        const response = await login(formData);
        console.log(response);
        if (response.status !== 200) {
          console.log(response.data.error);
          setErrorMessage({ message: response.data.error });
        }

        if (response.status === 200) {
          // console.log(rememberMe);
          // if (rememberMe) {
          //   setCookie("token", response.data.token, 30);
          // } else {
          //   setCookie("token", response.data.token,1);
          // }
          axios.defaults.headers.common["Authorization"] = response.data.token;
          // navigate("/");
          window.location.href = "/";
        } else {
          setValid(false);
        }
      }
      else if (formData.username.length ==0 || formData.username.length ==0) {
        setErrorMessage({ message: "Missing username or password" });
      }
      else {
        setErrorMessage({ message: "Invalid Username or Password" });
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);

      setErrorMessage({ message: error.message });
      console.error(error);
    }
  };

  const handleLoginInputChange = (event) => {
    setFormData({
      ...formData,
      [event.target.placeholder]: event.target.value,
    });
  };
  return (
    <>
      <h3 className="text-center mb-4">Đăng nhập</h3>
      <div
        className={`alert alert-danger my-2 d-flex align-items-center font-weight-bold ${
          !!errorMessage.message ? "d-block" : "d-none"
        }`}
      >
        <PriorityHighIcon className="me-2"></PriorityHighIcon>
        <div className="">{errorMessage.message}</div>
      </div>
      <div className="form-floating">
        <input
          type="text"
          className="form-control"
          id="floatingInput"
          placeholder="username"
          onChange={(event) => handleLoginInputChange(event)}
        />
        <label htmlFor="floatingInput">Tài khoản</label>
      </div>

      <div className="form-floating">
        <input
          type="password"
          className="form-control"
          id="floatingPassword"
          placeholder="password"
          onChange={(event) => handleLoginInputChange(event)}
        />
        <label htmlFor="floatingPassword">Mật khẩu</label>
      </div>

      {/* <div className="form-check text-start my-3">
        <input
          className="form-check-input"
          type="checkbox"
          value="remember-me"
          id="remember_me"
        />
        <label className="form-check-label" htmlFor="remember_me">
          Remember me
        </label>
      </div> */}

      <button
        className="btn btn-primary w-100 mt-2 py-2 d-flex align-items-center justify-content-center "
        type="submit"
        onClick={(event) => Login(event)}
        disabled={isLoading}
      >
        <span
          className={`spinner-border spinner-border-sm ${
            isLoading ? "d-block" : "d-none"
          }`}
          role="status"
          aria-hidden="true"
        ></span>
        <p className="mb-0 ms-2">Đăng nhập</p>
      </button>
      <hr className="my-4" />
      <button
        className="btn btn-outline-dark w-100 py-2"
        type="submit"
        onClick={(event) => {
          event.preventDefault();
          window.location.href = "/login/forgot-password";
        }}
      >
        Quên mật khẩu
      </button>
    </>
  );
}
