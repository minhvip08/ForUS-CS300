import { getNotification } from "../../../api/user";
import { infoUser } from "../../../api/user";
import { useEffect, useState } from "react";
import NotificationItem from "./notificationItem";
import { updateAllNotificationIsRead } from "../../../api/user";
import "./notification.css";

import "./notification.css";

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await getNotification();
      const userResponse = await infoUser();
      response.data.notifications.forEach((notification) => {
        let temp = userResponse.data.user.notifications.find(
          (n) => n.notification === notification._id
        );

        notification.isRead = temp.isRead;
      });

        console.log(response.data.notifications);
      setNotifications(response.data.notifications);
      // // add read status to notifications
      // notifications.forEach((notification) => {
      //   let notificationItem = document.getElementById(notification._id);
      //   // console.log(notificationItem);
      //   if (notification.isRead && notificationItem) {
      //     notificationItem.classList.add("read");
      //   }
      // });

      // console.log(response.data.notifications);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  // useEffect(() => {
  //   // add read status to notifications
  //   notifications.forEach((notification) => {
  //     let notificationItem = document.getElementById(notification._id);
  //     // console.log(notificationItem);
  //     if (notification.isRead && notificationItem) {
  //       notificationItem.classList.add("read");

  //     }
  //   });


  //   console.log(notifications);
  // }, [notifications.filter((n) => n.isRead === false).length]);

  const markAllAsRead = async () => {
    const response = await updateAllNotificationIsRead();
    console.log(response);
    if (response.data.success) {
      const updatedNotifications = notifications.map((notification) => {
        notification.isRead = true;
        return notification;
      });
      setNotifications(updatedNotifications);
    }
  };

  return (
    <>
      <div class="btn-group dropdown-center">
        <button
          type="button"
          className="btn btn-dark rounded-3"
          data-bs-toggle="dropdown"
          data-bs-display="static"
          aria-expanded="false"
        >
          <i className="bi bi-bell-fill me-2"></i>
          {notifications.length > 0 ? (
            <p className="position-absolute top-0 end-0 bg-danger text-white rounded-circle fw-bold f-13 w-24 h-24">
              {notifications.filter((n) => n.isRead === false).length}
            </p>
          ) : (
            <></>
          )}
        </button>

        {
          <ul className="dropdown-menu  dropdown-menu-md-end notification__content bg-white width-250"
          style={{minWidth: '30vw', maxHeight: '70vh', overflowY: 'auto', maxWidth: '50vw'}}
          >
            <li>
              <div className="d-flex justify-content-between align-items-center">
                <h1 className="dropdown-header">Thông báo</h1>
                <a href="/notification" className="pe-2">
                  Xem tất cả
                </a>
              </div>
            </li>

            {notifications.slice(0, 5).map((notification) => (
              <li key={notification._id}>
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                />
              </li>
            ))}

{loading ? (
              <li>
                <div className="text-center">
                  <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </li>
            ) : (
              <></>
            ) 
            }

            {notifications.length === 0 && !loading ? (
              <li>
                <p className="text-center text-muted ">Không có thông báo...</p>
              </li>
            ) : (
              <li>
                <a
                  href=""
                  className="dropdown-item   py-1 text-center notificationItem"
                  onClick={markAllAsRead}
                >
                  Đánh dấu tất cả là đã đọc
                </a>
              </li>
            )}


          </ul>
        }
      </div>
    </>
  );
}
