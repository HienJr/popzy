Modal.elements = [];
function Modal(options = {}) {
    this.opt = Object.assign(
        {
            closeMethods: ["button", "overlay", "escape"],
            footer: false,
            cssClass: [],
            destroyOnclose: true,
        },
        options
    );

    // ID modal
    this.template = document.querySelector(`#${this.opt.templateId}`);

    // Biến lưu độ rộng thanh cuộn
    let _scrollBarWidth;

    // Kiểm tra cách các cách đóng modal
    this._allowButtonClose = this.opt.closeMethods.includes("button");
    this._allowBackdropClose = this.opt.closeMethods.includes("overlay");
    this._allowEscapeClose = this.opt.closeMethods.includes("escape");

    this._footerButton = [];

    this._handleEscape = this._handleEscape.bind(this);
}

Modal.prototype._getScrollBarWidth = function () {
    if (this._scrollBarWidth) return this._scrollBarWidth;
    // tạo thẻ div để tính độ rộng
    const div = document.createElement("div");

    // Thêm các thuộc tính css vào style của thẻ div(dùng để đo scrollbar)
    Object.assign(div.style, {
        overflow: "scroll",
        position: "absolute",
        top: "-999",
    });

    // Thêm thẻ div vào body
    document.body.appendChild(div);
    this._scrollBarWidth = div.offsetWidth - div.clientWidth; // tính độ rộng của scrollbar
    document.body.removeChild(div); // Xóa thẻ div

    return this._scrollBarWidth; // Trả về kết quả tính
};

Modal.prototype._build = function () {
    // Clone lại content để không sao chép lại event
    const content = this.template.content.cloneNode(true);

    // Tạo thẻ backdrop(thẻ nền ở dưới modal) và add class
    this._backdrop = document.createElement("div");
    this._backdrop.className = "popzy__backdrop";

    // Tạo thẻ container(thẻ bao bọc bên ngoài) và add class
    const container = document.createElement("div");
    container.className = "popzy__container";

    // Duyệt danh sách class cần thêm trong option và thêm vào container
    this.opt.cssClass.forEach((className) => {
        if (typeof className === "string") {
            container.classList.add(className);
        }
    });

    // Tạo, thêm, xử lý nút đóng modal
    if (this._allowButtonClose) {
        const closeBtn = this._createButton("&times;", "popzy__close", () =>
            this.close()
        );
        container.append(closeBtn);
    }

    // Tạo thẻ bao bọc nội dung modal và thêm class
    const modalContent = document.createElement("div");
    modalContent.className = "popzy__content";

    // Thêm nội dung vào trong modal và append các thẻ vào theo thứ tự cấu trúc
    modalContent.append(content);
    container.append(modalContent);

    if (this.opt.footer) {
        this._modalFooter = document.createElement("div");
        this._modalFooter.className = "popzy__footer";

        this._renderFooterContent();
        this._renderFooterButtons();

        container.append(this._modalFooter);
    }

    this._backdrop.append(container);
    document.body.append(this._backdrop);
    return this._backdrop;
};

Modal.prototype.open = function () {
    Modal.elements.push(this);

    // Kiểm tra id truyền vào có hợp lệ hay không
    if (!this.template) {
        console.error(`#${this.this.opt.templateId} does not exist!`);
        return;
    }

    // Kiểm tra modal đã bật trước đó chưa
    if (!this._backdrop) {
        this._build();
    }

    // Thêm class show
    setTimeout(() => {
        this._backdrop.classList.add("popzy__show");
    }, 0);

    // Kiểm tra nội dung chính trong web có thanh cuộn hay không để thêm padding-right vào khi
    // modal bật tránh làm giật trang web
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
    const hasScrollbar = scrollbarWidth > 0;
    if (hasScrollbar) {
        document.body.classList.add("popzy__no-scroll");
        document.body.style.paddingRight = this._getScrollBarWidth() + "px";
    }

    // Đóng modal khi bấm ra ngoài modal
    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        };
    }

    // Đóng modal khi bấm nút escape
    if (this._allowEscapeClose) {
        document.addEventListener("keydown", this._handleEscape);
    }

    //
    this._onTransitionEnd(this.opt.onOpen);

    return this._backdrop;
};

Modal.prototype._setFooterContent = function (html) {
    this._footerContent = html;
    this._renderFooterContent();
};

Modal.prototype.addFooterButton = function (title, cssClass, callback) {
    const button = this._createButton(title, cssClass, callback);
    this._footerButton.push(button);
    this._renderFooterButtons();
};

Modal.prototype._renderFooterContent = function () {
    if (this._modalFooter && this._footerContent) {
        this._modalFooter.innerHTML = this._footerContent;
    }
};

Modal.prototype._renderFooterButtons = function () {
    if (this._modalFooter) {
        this._footerButton.forEach((button) => {
            this._modalFooter.append(button);
        });
    }
};

Modal.prototype._createButton = function (title, cssClass, callback) {
    const button = document.createElement("button");
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = callback;

    return button;
};

Modal.prototype.setModalContent = function (html) {
    this._footerContent = html;
    if (this._modalFooter) {
        this._modalFooter.innerHTML = html;
    }
};

// Hàm xử lý khi đóng modal bằng nút escape
Modal.prototype._handleEscape = function (e) {
    const lastModal = Modal.elements[Modal.elements.length - 1];

    if (e.key === "Escape" && this === lastModal) {
        this.close();
    }
};

Modal.prototype._onTransitionEnd = function (callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== "transform") return;
        if (typeof callback === "function") callback();
    };
};

// Hàm xử lý đóng modal
Modal.prototype.close = function (destroy = this.opt.destroyOnclose) {
    Modal.elements.pop();
    this._backdrop.classList.remove("popzy__show");

    this._onTransitionEnd(() => {
        if (this._backdrop && destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._modalFooter = null;
        }

        if (!Modal.elements.length) {
            document.body.classList.remove("popzy__no--scroll");
            document.body.style.paddingRight = "";
        }

        // Xóa xự kiện keydown để tránh lỗi
        document.removeEventListener("keydown", this._handleEscape);

        if (typeof this.opt.onClose === "function") {
            this.opt.onClose();
        }
    });
};

// Hàm đóng modal
Modal.prototype.destroy = function () {
    this.close(true);
};
