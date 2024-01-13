import { useEffect, useState } from "react";
import { instance } from "../../../api/config";

import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import ReplyIcon from "@mui/icons-material/Reply";

export default function NotificationItem({ notification }) {
  // Calculate time difference between createdAt and now
  useEffect(() => {
    const createdAt = new Date(notification.createdAt);
    const now = new Date();
    const diff = now - createdAt;
    const diffInMinutes = Math.floor(diff / 1000 / 60);


    if (diffInMinutes < 60) {
      setDiff(diffInMinutes);
      setUnit("phút");
    } else if (diffInMinutes < 24 * 60) {
      setDiff(Math.floor(diffInMinutes / 60));
      setUnit("giờ");
    } else if (diffInMinutes < 24 * 60 * 30) {
      setDiff(Math.floor(diffInMinutes / 60 / 24));
      setUnit("ngày");
    } else if (diffInMinutes < 24 * 60 * 30 * 12) {
      setDiff(Math.floor(diffInMinutes / 60 / 24 / 30));
      setUnit("tháng");
    } else {
      setDiff(Math.floor(diffInMinutes / 60 / 24 / 30 / 12));
      setUnit("năm");
    }

    console.log(notification.isRead);
    const notificationItem = document.getElementById(notification._id);
    console.log(notificationItem);

    if (notification.isRead === true) {
      notificationItem.classList.add("read");
    }
  }, []);

  const [diff, setDiff] = useState(0);
  const [unit, setUnit] = useState("");

  const updateNotificationStatus = async () => {
    const response = await instance.put(
      `/users/notification/${notification._id}`
    );
    console.log(response);
    if (response.status === 200) {
      const notificationItem = document.getElementById(notification._id);
      notificationItem.classList.add("read");
    }
  };

  return (
    <a
      href={!!notification.thread ? ("/thread/" + notification.thread  + (notification.comment ? '#' +notification.comment  : '') ) : "#"}

      class="dropdown-item list-group-item-action d-flex  gap-3 py-3 notificationItem  "
      id={notification._id}
      aria-current="true"
      onClick={updateNotificationStatus}
    >
      {console.log(notification)}
      {notification.from === "admin" ? (
        <SettingsSuggestIcon
          fontSize="large"
          className="rounded-circle flex-shrink-0"
        ></SettingsSuggestIcon>
      ) : notification.from === "reply" ? (
        <ReplyIcon
          fontSize="large"
          className="rounded-circle flex-shrink-0"
        ></ReplyIcon>
      ) : (
        <NotificationsIcon
          fontSize="large"
          className="rounded-circle flex-shrink-0"
        ></NotificationsIcon>
      )}
      <div class="d-flex gap-2 w-100 justify-content-between">
        <div>
          <p className="mb-0 fw-bold">{notification.title}</p>
          <p className="mb-0 opacity-75  ">{notification.body}.</p>
        </div>
        <small className="opacity-50 text-nowrap">
          {diff} {unit} trước
        </small>
      </div>
    </a>
  );
}
