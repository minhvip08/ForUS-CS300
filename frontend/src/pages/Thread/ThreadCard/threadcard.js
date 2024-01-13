import "../card.css";
import { ThreadHorizontalVoteBar } from "../UserControl/usercontrol";
import { getTimePassed } from "../../../utils/getTimePassed";
import { useEffect, useState } from "react";
import { downloadImage } from "../../../utils/loadImage";
import TextRenderer from "../../Text/renderer";
import {
  UpdateThreadButton,
  DeleteThreadButton,
  ReportThreadButton,
  ReportUserButton,
  CopyLinkButton
} from "../UserControl/usercontrol";
import Editor from "../../Editor/editor";
import EditorContext from "../../Editor/context";
import { useContext } from "react";
import { ThreadContext } from "../context";

export default function ({ thread }) {
  const [profilePicture, setProfilePicture] = useState(null);
  useEffect(() => {
    async function getProfilePicture() {
      var url;
      if (!thread.author.avatarUrl) url = null;
      else url = await downloadImage(
        "images/avatar/" + thread.author.avatarUrl
      );
      setProfilePicture(url);
    }
    getProfilePicture();
  }, []);

  const [isEditMode, setIsEditMode] = useState(false);

  const handleUpdateClick = () => {
    setIsEditMode(!isEditMode);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const { setThread } = useContext(ThreadContext);

  return (
    <div className="card-bod m-0" style={{ margin: "20px 0" }}>
      <div className="row m-0 p-0 flex-grow-1">
        <div
          className="col-lg-2 bg-card-secondary round-left d-flex flex-column align-items-center text-center"
          style={{ paddingTop: "20px", paddingInline: "20px" }}
        >
          <img
            className="rounded-circle centered-and-cropped bg-dark"
            width={100}
            height={100}
            src={
              profilePicture
                ? profilePicture
                : "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"
            }
            alt="avatar"
          />
          <a className="text-start user-link username mt-2" href={`/user/${thread.author._id}`}>{thread.author && thread.author.fullname}</a>
          <p>
            {thread.isUpdater != 1 ? <ReportUserButton user={thread.author}/> : null}
          </p>
        </div>
        <div className="col-lg-10 bg-card-primary round-right d-flex flex-column justify-content-between">
          <div
            className="row-12 d-flex justify-content-between"
            style={{
              margin: "0 20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.7)",
              padding: "16px 0px 10px",
            }}
          >
            <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              <i className="bi bi-clock"></i> {getTimePassed(thread.createdAt)}
            </div>
            <div className="d-flex justify-content-between">
              <CopyLinkButton url={"/thread/" + thread._id }/>
              <ReportThreadButton thread={thread}/>
              {thread.isUpdater == 1 ? (
                <UpdateThreadButton setOnClick={handleUpdateClick} />
              ) : null}
              {thread.isDeleter == 1 ? (
                <DeleteThreadButton thread={thread} />
              ) : null}
            </div>
          </div>

          {isEditMode ? (
            // Render editor in edit mode
            <div
              className="justify-content-between"
              style={{ padding: "10px" }}
            >
              <EditorContext.Provider
                value={{
                  type: "updateThread",
                  state: thread,
                  setState: setThread,
                  oldBody: thread.body,
                  update: handleCancelEdit,
                }}
              >
                <Editor />
              </EditorContext.Provider>
            </div>
          ) : (
            <div style={{ padding: "0px 20px" }}>
              {/* Render thread body */}
              <div style={{ padding: "10px 0px 20px" }}>
                <TextRenderer input={thread.body} thread={thread} setThread={setThread} />
              </div>

              {/* Display updated timestamp */}
              <div
                className="py-0.5 px-0 m-0 d-flex flex-row-reverse justify-content-between text-right"
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.8rem",
                }}
              >
                Chỉnh sửa lần cuối: {getTimePassed(thread.updatedAt)}
              </div>

              <div className="py-3 px-0 m-0 d-flex flex-row-reverse justify-content-stretch gap-4">
                  {/* Vote bar */}
                  <div className="py-3 px-0 m-0 d-flex flex-row-reverse justify-content-stretch gap-4">
                    <ThreadHorizontalVoteBar thread={thread} />
                  </div>

                  {/* Reply button */}
                  <button
                      type="button"
                      className="btn text-white"
                      style={{ fontWeight: 'bold' }}
                      onClick={() => {
                          document.querySelector("#comment-editor")?.scrollIntoView?.();
                      }}
                  >
                      <span className="ms-2"><i className="bi bi-chat"></i></span>
                      {' '} Bình luận
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
