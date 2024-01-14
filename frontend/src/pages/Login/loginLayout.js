import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useReducer, useState } from "react";
import { setCookie } from "../../utils/setCookie";
import axios from "axios";
import Logo from "../../components/icons/logo";
import logo from "../../assets/icons/logo.png";
import "./login.css";

// import { Outlet } from "react-router-dom";


export default function Login({ auth }) {

    return auth ? <Navigate to="/" /> :(
      <div>
        <div className="d-flex align-items-center py-4 bg-body-tertiary vh-100 ">
        <main className="form-signin w-100 m-auto">
          <form>
            <img src={logo} alt="Logo" className="my-4 align-items-center "/>
  
            <Outlet />


  

  

            <div className="d-flex flex-column mt-4 mb-3 align-items-start">
              <p className="text-muted text-start">Tài khoản: administrator <br></br> Mật khẩu: 12345</p>
            </div>
            <p className="text-muted ">© ForUS 2023-2024</p>
          </form>
        </main>
      </div>
      </div>

    );
}