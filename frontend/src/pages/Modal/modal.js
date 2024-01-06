import React from "react";

export function DeleteModal({ isOpen, handleClose, handleDelete, modalTitle, modalContent }) {
    const overlayStyle = {
        display: isOpen ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
    };
    
    const modalStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
    };
    
    return (
        <>
            <div style={overlayStyle} onClick={handleClose}></div>
            <div className={`modal fade ${isOpen ? 'show' : ''}`} tabIndex="-1" role="dialog" style={{ display: isOpen ? 'block' : 'none', modalStyle }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style={{ background: '#1D76C6', border: '1px solid #46A5FA' }} >
                        <div class="modal-header" style={{ borderBottom: '1px solid #46A5FA'}}>
                            <h1 className="modal-title fs-5 text-white" id="deleteModalLabel">{modalTitle}</h1>
                            <button type="button" className="btn text-white" onClick={handleClose}>x</button>
                        </div>
                        <div className="modal-body text-white">
                            {modalContent}
                        </div>
                        <div class="modal-footer" style={{ borderTop: '1px solid #46A5FA'}}>
                            <button type="button" className="btn btn-primary" onClick={handleClose}>Đóng</button>
                            <button type="button" className="btn btn-danger" onClick={handleDelete}>Xóa</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export function UpdateModal({ isOpen, handleClose, modalTitle, modalContent }) {
    const overlayStyle = {
        display: isOpen ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
    };
    
    const modalStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
    };
    
    return (
        <>
            <div style={overlayStyle} onClick={handleClose}></div>
            <div className={`modal fade ${isOpen ? 'show' : ''}`} tabIndex="-1" role="dialog" style={{ display: isOpen ? 'block' : 'none', modalStyle }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style={{ background: '#1D76C6', border: '1px solid #46A5FA' }} >
                        <div class="modal-header" style={{ borderBottom: '1px solid #46A5FA'}}>
                            <h1 className="modal-title fs-5 text-white" id="deleteModalLabel">{modalTitle}</h1>
                            <button type="button" className="btn text-white" onClick={handleClose}>x</button>
                        </div>
                        <div className="modal-body text-white">
                            {modalContent}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}