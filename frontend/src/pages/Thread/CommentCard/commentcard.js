import '../card.css';
import { CommentHorizontalVoteBar, CopyLinkButton, ReportUserButton } from '../UserControl/usercontrol';
import { useEffect, useState, useContext, createContext } from "react";
import { downloadImage } from "../../../utils/loadImage";
import { getTimePassed } from '../../../utils/getTimePassed';
import TextRenderer from '../../Text/renderer';
import { DeleteCommentButton, UpdateCommentButton, ReportCommentButton } from '../UserControl/usercontrol';
import Editor from '../../Editor/editor';
import EditorContext from '../../Editor/context';
import { ThreadContext } from '../context';
import './commentcard.css';
import getCommentLocation from '../../../utils/getCommentLocation';

export default function ({ comment, onReplyClick }) {
    const [profilePicture, setProfilePicture] = useState(null);
    useEffect(() => {
        async function getProfilePicture() {
            var url;
            if (!comment.author.avatarUrl) url = null;
            else url = await downloadImage('images/avatar/' + comment.author.avatarUrl);
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

    const { thread, setThread } = useContext(ThreadContext);

    return (
        <div className="card-body comment-card"style={{ margin: '20px 0' }} id={comment._id}>
            <div className="row m-0 p-0">
                <div className="col-lg-2 bg-card-secondary round-left d-flex flex-column align-items-center text-center"
                    style={{ paddingTop: '20px', paddingInline: '20px' }}
                >
                    <img className="rounded-circle centered-and-cropped bg-dark" width={100} height={100} src={
                        profilePicture ? profilePicture : 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png'
                    } alt="avatar"/>
                    <a className="username mt-2 user-link" href={`/user/${comment.author && comment.author._id}`}>
                        {comment.author && comment.author.fullname}
                    </a>
                    <p style={{ cursor: "pointer" }}>{comment.isUpdater != 1 ? <ReportUserButton user={comment.author}/> : null}</p>
                </div>
                <div className="col-lg-10 bg-card-primary round-right d-flex flex-column justify-content-between">
                    <div className="row-12 d-flex justify-content-between" style={{ margin: '0 20px',borderBottom: '1px solid rgba(255, 255, 255, 0.7)', padding: '16px 0px 10px' }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            <i className="bi bi-clock"></i>
                            {' '}
                            {getTimePassed(comment.createdAt)}
                        </div>
                        <div className="d-flex justify-content-between">
                            <CopyLinkButton url={"/thread/" + thread._id + "#" + comment._id}/>
                            <ReportCommentButton comment={comment}/>
                            {comment.isUpdater == 1 ? (
                                <UpdateCommentButton setOnClick={handleUpdateClick}/>
                            ) : null}
                            {comment.isDeleter == 1 ? (
                                <DeleteCommentButton comment={comment}/>
                            ) : null}
                        </div>
                    </div>

                        {isEditMode ? (
                            // Render editor in edit mode
                            <div className="justify-content-between" style={{ padding: '10px' }}>
                                <EditorContext.Provider value={{ type: "updateComment", state: thread, setState: setThread, comment: comment, oldBody: comment.body, update: handleCancelEdit }}>
                                    <Editor  />
                                </EditorContext.Provider>
                            </div>
                        ) : (
                            <div style={{ padding: '0px 20px' }}>
                                {/* Display replyTo information */}
                                {comment.reply ? (
                                    <div className="justify-content-between" style={{ marginTop: '20px', border: '1px solid #46A5FA', borderRadius: '8px', backgroundColor: '#07457D', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        <div
                                            title={comment.reply._id}
                                            className='comment-link'
                                            style={{ color: '#FF944D', fontWeight: 'bold', borderBottom: '1px solid #46A5FA', padding: '8px 20px' }}
                                            onClick={async () => {
                                                let commentCard = Array.from(document.getElementsByClassName('comment-card')).find((card) => card.id == comment.reply._id);
                                                if (commentCard) {
                                                    commentCard.scrollIntoView();
                                                }
                                                else {
                                                    let location = await getCommentLocation(comment.reply._id);
                                                    window.location.href = `/thread/${location.thread._id}/${location.page}#${location._id}`;
                                                }
                                            }} 
                                        >
                                            {comment.reply && comment.reply.author && comment.reply.author.fullname}
                                            {' '} said:
                                        </div>
                                        <div style={{ padding: '20px 20px' }}>
                                            <TextRenderer input={comment.reply && comment.reply.body} />
                                        </div>
                                    </div>
                                ) : comment.replyTo ? (
                                    <div className="justify-content-between" style={{ marginTop: '20px', border: '1px solid #46A5FA', borderRadius: '8px', backgroundColor: '#07457D', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        <div style={{ color: '#FF944D', fontWeight: 'bold', borderBottom: '1px solid #46A5FA', padding: '8px 20px' }}>
                                            {'[deleted]'} said:
                                        </div>
                                        <div style={{ padding: '20px 20px' }}>
                                            [deleted]
                                        </div>
                                    </div>
                                ) : null}

                            {/* Display comment body */}
                            <div style={{ padding: '10px 0px 20px' }}>
                                <TextRenderer input={comment.body}/>
                            </div>

                            {/* Display updated timestamp */}
                            <div className="py-0.5 px-0 m-0 d-flex flex-row-reverse justify-content-between text-right" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                                Chỉnh sửa lần cuối: {getTimePassed(comment.updatedAt)}
                            </div>

                            <div className="py-3 px-0 m-0 d-flex flex-row-reverse justify-content-stretch gap-4">
                                {/* Vote bar */}
                                <CommentHorizontalVoteBar comment={comment} />

                                {/* Reply button */}
                                <button
                                    type="button"
                                    className="btn text-white"
                                    style={{ fontWeight: 'bold' }}
                                    onClick={() => {
                                        onReplyClick(comment);
                                        console.log('Replying to comment:', comment);
                                        document.querySelector("#comment-editor")?.scrollIntoView?.();
                                    }}
                                >
                                    <span className="ms-2"><i className="bi bi-reply"></i></span>
                                    {' '} Reply 
                                </button>
                            </div>
                        </div>
                    )}        
                </div>
            </div>
        </div>
    );
}