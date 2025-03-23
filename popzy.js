Popzy.elements = [];
function Popzy(options = {}) {
    this.opt = Object.assign(
        {
            closeMethods: ["button", "overlay", "escape"],
            footer: false,
            cssClass: [],
            destroyOnclose: true,
        },
        options
    );

    // ID popzy
    this.template = document.querySelector(`#${this.opt.templateId}`);

    // Biến lưu độ rộng thanh cuộn
    let _scrollBarWidth;

    // Kiểm tra cách các cách đóng popzy
    this._allowButtonClose = this.opt.closeMethods.includes("button");
    this._allowBackdropClose = this.opt.closeMethods.includes("overlay");
    this._allowEscapeClose = this.opt.closeMethods.includes("escape");

    this._footerButton = [];

    this._handleEscape = this._handleEscape.bind(this);
}

Popzy.prototype._getScrollBarWidth = function () {
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

Popzy.prototype._build = function () {
    // Clone lại content để không sao chép lại event
    const content = this.template.content.cloneNode(true);

    // Tạo thẻ backdrop(thẻ nền ở dưới popzy) và add class
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

    // Tạo, thêm, xử lý nút đóng popzy
    if (this._allowButtonClose) {
        const closeBtn = this._createButton("&times;", "popzy__close", () =>
            this.close()
        );
        container.append(closeBtn);
    }

    // Tạo thẻ bao bọc nội dung popzy và thêm class
    const popzyContent = document.createElement("div");
    popzyContent.className = "popzy__content";

    // Thêm nội dung vào trong popzy và append các thẻ vào theo thứ tự cấu trúc
    popzyContent.append(content);
    container.append(popzyContent);

    if (this.opt.footer) {
        this._popzyFooter = document.createElement("div");
        this._popzyFooter.className = "popzy__footer";

        this._renderFooterContent();
        this._renderFooterButtons();

        container.append(this._popzyFooter);
    }

    this._backdrop.append(container);
    document.body.append(this._backdrop);
    return this._backdrop;
};

Popzy.prototype.open = function () {
    Popzy.elements.push(this);

    // Kiểm tra id truyền vào có hợp lệ hay không
    if (!this.template) {
        console.error(`#${this.this.opt.templateId} does not exist!`);
        return;
    }

    // Kiểm tra popzy đã bật trước đó chưa
    if (!this._backdrop) {
        this._build();
    }

    // Thêm class show
    setTimeout(() => {
        this._backdrop.classList.add("popzy__show");
    }, 0);

    // Kiểm tra nội dung chính trong web có thanh cuộn hay không để thêm padding-right vào khi
    // popzy bật tránh làm giật trang web
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
    const hasScrollbar = scrollbarWidth > 0;
    if (hasScrollbar) {
        document.body.classList.add("popzy__no-scroll");
        document.body.style.paddingRight = this._getScrollBarWidth() + "px";
    }

    // Đóng popzy khi bấm ra ngoài popzy
    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        };
    }

    // Đóng popzy khi bấm nút escape
    if (this._allowEscapeClose) {
        document.addEventListener("keydown", this._handleEscape);
    }

    //
    this._onTransitionEnd(this.opt.onOpen);

    return this._backdrop;
};

Popzy.prototype._setFooterContent = function (html) {
    this._footerContent = html;
    this._renderFooterContent();
};

Popzy.prototype.addFooterButton = function (title, cssClass, callback) {
    const button = this._createButton(title, cssClass, callback);
    this._footerButton.push(button);
    this._renderFooterButtons();
};

Popzy.prototype._renderFooterContent = function () {
    if (this._popzyFooter && this._footerContent) {
        this._popzyFooter.innerHTML = this._footerContent;
    }
};

Popzy.prototype._renderFooterButtons = function () {
    if (this._popzyFooter) {
        this._footerButton.forEach((button) => {
            this._popzyFooter.append(button);
        });
    }
};

Popzy.prototype._createButton = function (title, cssClass, callback) {
    const button = document.createElement("button");
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = callback;

    return button;
};

Popzy.prototype.setPopzyContent = function (html) {
    this._footerContent = html;
    if (this._popzyFooter) {
        this._popzyFooter.innerHTML = html;
    }
};

// Hàm xử lý khi đóng popzy bằng nút escape
Popzy.prototype._handleEscape = function (e) {
    const lastPopzy = Popzy.elements[Popzy.elements.length - 1];

    if (e.key === "Escape" && this === lastPopzy) {
        this.close();
    }
};

Popzy.prototype._onTransitionEnd = function (callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== "transform") return;
        if (typeof callback === "function") callback();
    };
};

// Hàm xử lý đóng popzy
Popzy.prototype.close = function (destroy = this.opt.destroyOnclose) {
    Popzy.elements.pop();
    this._backdrop.classList.remove("popzy__show");

    this._onTransitionEnd(() => {
        if (this._backdrop && destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._popzyFooter = null;
        }

        if (!Popzy.elements.length) {
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

// Hàm đóng popzy
Popzy.prototype.destroy = function () {
    this.close(true);
};
