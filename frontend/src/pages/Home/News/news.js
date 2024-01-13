import React, { useEffect, useState } from 'react';
import { instance } from '../../../api/config';
import NewsItem from './newsItem';

export default function News(){
    const [notificationFromAdmin, setNotificationFromAdmin] = useState([]);
    useEffect(() => {
        const fetchNews = async () => {
            const response = await instance.get("/users/notification");
            const notificationFromAdmin = response.data.notifications.filter((notification) => notification.from === 'admin');
            setNotificationFromAdmin(notificationFromAdmin);


        }
        fetchNews();
    }, []);

    return (
        <div className=" ">
            <div className=" text-start  ">
                <div className="card mb-4 rounded-3 shadow-sm bg-primary  ">
                    <div className="card-header py-3 ">
                        <h4 className="text-white">Thông báo mới</h4>
                    </div>
                    <div className="card-body">
                        
                        <ul className="list-unstyled mt-3 mb-4 m-2">
                            {notificationFromAdmin && notificationFromAdmin.slice(0, 5).map((notification) => (
                                <li className="text-white" key={notification._id}>
                                    <NewsItem notification={notification} />
                                </li>
                            ))}
                            {notificationFromAdmin.length === 0 && <h5 className="text-white">Không có tin mới</h5>}
                        </ul>

                    </div>
                </div>
            </div>
        </div>
    )

}