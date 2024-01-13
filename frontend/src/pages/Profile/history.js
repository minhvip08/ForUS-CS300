// ThreadHistory.js
import { useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import ThreadCard from "../Box/ThreadCard/threadcard"; // Update with the correct path
import { getThreadHistory } from "../../api/user"; // Update with the correct API function
import { BoxContext } from "../Box/context";
import { Pagination } from "../Box/UserControl/usercontrol";

const ThreadHistory = ({ user_id, changeID }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [threadHistory, setThreadHistory] = useState([]);

  useEffect(() => {
    const fetchThreadHistory = async () => {
      if (!user_id) return;
      try {
        // Replace with your actual API function and parameters
        const response = await getThreadHistory(user_id);

        if (response.status === 200) {
          setThreadHistory(response.data.threadHistory);
        }
      } catch (error) {
        console.error(error);
        // Handle error
      }
    };

    fetchThreadHistory();
  }, [user_id, location.key]); // Include user_id in the dependency array

  return (
    <div>
      <h1 className="mb-3 text-white">Thread History</h1>
      {threadHistory.map((thread) => (
        <BoxContext.Provider
          value={{
            box: null,
            setBox: () => {},
            moderatorStatus: false,
            setAutoRedirect: () => {},
          }}
        >
          <ThreadCard thread={thread} search={false} hideSection={true} />
        </BoxContext.Provider>
      ))}
      <nav>
        <ul className="pagination justify-content-center">
          <li className="page-item">
            <button className="page-link" aria-label="Previous" disabled>
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>
          <li className="page-item active">
            <button className="page-link">1</button>
          </li>
          <li className="page-item">
            <button className="page-link" aria-label="Next" disabled>
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const CommentHitory = () => {};

export default ThreadHistory;
