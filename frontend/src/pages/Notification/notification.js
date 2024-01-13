import { getNotification } from "../../api/user"
import { useEffect, useState } from "react"
import NotificationItem from "./notificationItem"
import { infoUser } from "../../api/user"
import "./notification.css"
export default function Notification (){
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
    
          setNotifications(response.data.notifications);
          
    
          setLoading(false);
        };
    
        fetchNotifications();
      }, []);
    return(
        <div className="container">
            <div className="py-5 container bg-info rounded-3 shadow-sm">
                <div className="order-md-1 text-start">
                <h1 className="mb-3 text-white ms-3">Thông báo: </h1>
                {loading ? (
                    <div className="text-center">
                        <div
                      className="spinner-border text-primary"
                      role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                        </div>
                        </div>
                        ) : (
                            <></>
                        )}
                {notifications.map((notification) => (
              <li key={notification._id}
                    style={{ listStyleType: "none" }}
                    className="mb-3"
              >
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                />
              </li>
            ))
            
            }

{notifications.length && !loading === 0 ? (
              <li>
                <p className="text-center text-muted ">No notifications</p>
              </li>
            ) : (
              <></>
            )}
                </div>
            </div>

        </div>
    )
}