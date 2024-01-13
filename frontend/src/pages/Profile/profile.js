// import "./profile.css";
import React, { useState, useEffect } from "react";
import { infoUser } from "../../api/user";
import { storage } from "../../Firebase/config";
import { downloadImage, deleteImage } from "../../utils/loadImage";
import { updateProfile, updatePassword } from "../../api/user";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 } from "uuid";
import "./profile.css";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ThreadHistory from "./history";
import { instance } from "../../api/config";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null); // [file, setFile]
  const [avatar, setAvatar] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState({});
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await infoUser();
        console.log(response);
        if (response.status === 200) {
          setFullname(response.data.user.fullname);
          setEmail(response.data.user.email);
          setStudentId(response.data.user.username);
          setAddress(response.data.user.address);
          setBio(response.data.user.description);
          setUserId(response.data.user._id);
          setAvatarUrl(response.data.user.avatarUrl);

          const imageUrl =
            response.data.user.avatarUrl == null
              ? null
              : await downloadImage(
                  "images/avatar/" + response.data.user.avatarUrl
                );
          console.log(imageUrl);
          setAvatar(imageUrl);
        }
      } catch (e) {
        setError(e);
        console.log(e);
      }
    };
    fetchData();
  }, []);

  const uploadImage = async () => {
    try {
      if (avatarFile == null) return;
      const imgRef = v4();
      deleteImage(`images/avatar/${avatarUrl}`);
      setAvatarUrl(imgRef);

      const imageRef = ref(storage, `images/avatar/${imgRef}`);
      await uploadBytes(imageRef, avatarFile);
      return imgRef;
    } catch (e) {
      console.log(e);
    }
  };

  const updatePasswordFunction = async () => {
    try {
      const data = {
        currentPassword,
        newPassword,
        confirmNewPassword,
      };
      const response = await updatePassword(data);
      console.log(response);
      if (response.status === 200) {
        alert("Update password successfully");
      } else {
        setError({ message: "Invalid Password" });
      }
    } catch (e) {
      setError({ message: e.message });
      console.log(e);
    }
  };

  const updateProfileFunction = async () => {
    try {
      const avatarUrl = await uploadImage();
      console.log(avatarUrl);

      const data = {
        fullname,
        email,
        studentId,
        description: bio,
        address,
        avatarUrl,
      };
      const response = await updateProfile(data);
      console.log(response);
      alert("Update profile successfully");
    } catch (e) {
      setError({ message: e.message });
      console.log(e);
    }
  };

  const handleUploadButtonClick = () => {
    document.getElementById("uploadAvatar").click();
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
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
                    activeTab === "profile" ? "active" : ""
                  } text-white`}
                  id="nav-home-tab"
                  onClick={() => handleTabClick("profile")}
                >
                  Hồ sơ
                </button>

                <button
                  className={`nav-link ${
                    activeTab === "password" ? "active" : ""
                  } + text-white`}
                  id="nav-password-tab"
                  onClick={() => handleTabClick("password")}
                >
                  Quản lý mật khẩu
                </button>

                <button
                  className={`nav-link ${
                    activeTab === "threadHistory" ? "active" : ""
                  } + text-white`}
                  id="nav-threadHist-tab"
                  onClick={() => handleTabClick("threadHistory")}
                >
                  Lịch sử bài đăng
                </button>

                <button
                  className={`nav-link ${
                    activeTab === "commentHistory" ? "active" : ""
                  } + text-white`}
                  id="nav-commentHist-tab"
                  onClick={() => handleTabClick("commentHistory")}
                >
                  Lịch sử bình luận
                </button>
              </div>
            </nav>
            <div className="tab-content" id="nav-tabContent">
              <div
                className={`alert alert-danger alert-dismissible fade show ${
                  !!error.message ? "d-block" : "d-none"
                }`}
                role="alert"
              >
                {error.message}
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="alert"
                  aria-label="Close"
                ></button>
              </div>
              <div
                className={`tab-pane fade ${
                  activeTab === "profile" ? "show active" : ""
                }`}
                id="nav-profile"
                role="tabpanel"
                aria-labelledby="nav-profile-tab"
              >
                <div className="order-md-1 text-start">
                  <h1 className="mb-3 text-white">Hồ sơ</h1>
                  <p className="lead text-white">
                    Cập nhật thông tin cá nhân của bạn tại đây.
                  </p>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <div className="text-center">
                        <div>
                          <label htmlFor="avatar" className="form-label">
                            Your avatar
                          </label>
                        </div>

                        <img
                          src={
                            avatar
                              ? avatar
                              : "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"
                          }
                          className="rounded-5 text-center centered-and-cropped"
                          id="avatarImage"
                          alt="avatar"
                          width="150"
                          height="150"
                        />
                        <div className="mt-2">
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={handleUploadButtonClick}
                          >
                            Đổi Avatar
                          </button>
                          <input
                            className="form-control"
                            type="file"
                            accept="image/*"
                            id="uploadAvatar"
                            onChange={(e) => {
                              if (
                                !!e.target.files[0] &&
                                e.target.files[0].type.startsWith("image")
                              ) {
                                setAvatarFile(e.target.files[0]);
                                setAvatar(
                                  URL.createObjectURL(e.target.files[0])
                                );
                              } else {
                                setError({ message: "Invalid file type" });
                              }
                            }}
                            hidden
                          ></input>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-8 mb-3">
                      <label htmlFor="bio-text" className="form-label">
                        Bio
                      </label>
                      <textarea
                        className="form-control text-white"
                        id="bio-text"
                        value={bio}
                        rows="5"
                        onChange={(e) => setBio(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                  <hr className="mb-4" />

                  <form className="needs-validation" noValidate>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="firstName " className="text-white">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          className="form-control text-white "
                          id="firstName"
                          value={fullname}
                          onChange={(e) => setFullname(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback text-white">
                          Valid first name is required.
                        </div>
                      </div>
                      <div className="col-md-6 mb-3 text-white">
                        <label htmlFor="lastName">Student ID</label>
                        <input
                          type="text"
                          className="form-control text-white"
                          id="studentID"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          // placeholder
                          required
                        />
                        <div className="invalid-feedback text-white">
                          Valid StudentID is required.
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="text-white">
                        Email
                      </label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">@</span>
                        </div>
                        <input
                          type="email"
                          className="form-control text-white"
                          id="email"
                          value={email}
                          placeholder="you@example.com"
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        {/* <div className="invalid-feedback">
                    Please enter a valid email address for shipping updates.
                  </div> */}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="address" className="text-white">
                        Địa chỉ
                      </label>
                      <input
                        type="text"
                        className="form-control text-white"
                        id="address"
                        value={address}
                        placeholder="1234 Main St"
                        required
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      <div className="invalid-feedback">
                        Please enter your address.
                      </div>
                    </div>

                    {/* <hr className="mb-4" />
                    <h4 className="mb-3">More information</h4>
                    <div className="mb-3">
                      <label
                        htmlFor="formFile text-white"
                        className="form-label"
                      >
                        Load your avatar
                      </label>
                      <input
                        className="form-control"
                        type="file"
                        accept="image/*"
                        id="formFile"
                        onChange={(e) => {
                          console.log(e.target.files[0]);
                          setAvatarUrl(e.target.files[0]);
                        }}
                      ></input>
                    </div>

                    <div className="row">
                      <div className="mb-3">
                        <label htmlFor="bio-text" className="form-label">
                          Bio
                        </label>
                        <textarea
                          className="form-control"
                          id="bio-text"
                          rows="3"
                          onChange={(e) => setBio(e.target.value)}
                        ></textarea>
                      </div>
                    </div> */}
                    <hr className="mb-4" />
                    <div className="d-flex justify-content-between w-100">
                      <button
                        className="btn btn-warning btn-lg"
                        type="submit"
                        onClick={(event) => {
                          event.preventDefault();
                          updateProfileFunction();
                        }}
                      >
                        Cập nhật
                      </button>

                      {/* <button
                        className="btn btn-danger btn-lg"
                        type="submit"
                        onClick={handleBanButtonClick}
                      >
                        {!banned ? "Ban" : "Unban"} this user
                      </button> */}
                    </div>
                  </form>
                </div>
              </div>
              <div
                className={`tab-pane fade ${
                  activeTab === "password" ? "show active" : ""
                }`}
                id="nav-password"
                role="tabpanel"
                aria-labelledby="nav-password-tab"
              >
                <div className="order-md-1 text-start ">
                  <h1 className="mb-3 text-white">Quản lý mật khẩu</h1>

                  <p>
                    Để đảm bảo an toàn cho tài khoản của bạn, vui lòng thay đổi
                    mật khẩu thường xuyên.
                  
                  </p>

                  <div className="   ">
                    <div className="mb-3 row ">
                      <div className="mb-3 col-md-4 "></div>
                      <div className="mb-3 col-md-4  ">
                        <label htmlFor="address">Mật khẩu hiện tại</label>
                        <input
                          type="password"
                          className="form-control text-white "
                          id="currentPassword"
                          placeholder="***********"
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">
                          Please enter your current password.
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 row ">
                      <div className="mb-3 col-md-4 "></div>
                      <div className="mb-3 col-md-4">
                        <label htmlFor="address">Mật khẩu mới</label>
                        <input
                          type="password"
                          className="form-control text-white"
                          id="newPassword"
                          placeholder="***********"
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">
                          Please enter your new password.
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 row ">
                      <div className="mb-3 col-md-4 "></div>

                      <div className="mb-3 col-md-4">
                        <label htmlFor="address">Xác nhận mật khẩu</label>
                        <input
                          type="password"
                          className="form-control text-white"
                          id="confirmNewPassword"
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                          placeholder="***********"
                          required
                        />
                        <div className="invalid-feedback">
                          Please enter your new password.
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-warning btn-lg btn-block "
                      type="submit"
                      onClick={(event) => {
                        event.preventDefault();
                        updatePasswordFunction();
                      }}
                    >
                      Cập Nhật
                    </button>
                  </div>
                </div>
              </div>
              <div
                className={`tab-pane fade ${
                  activeTab === "threadHistory" ? "show active" : ""
                }`}
                id="nav-threadHist"
                role="tabpanel"
                aria-labelledby="nav-threadHist-tab"
              >
                <ThreadHistory user_id={userId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
