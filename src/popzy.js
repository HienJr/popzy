Popzy.elements = [];
function Popzy(options = {}) {
  if (!options.content && !options.templateId) {
    console.error("You must provide one of 'content' or 'templateId'");
    return;
  }
  if (options.content && options.templateId) {
    options.templateId = null;
    console.warn(
      "Both 'content' and 'templateId' are specified. 'content' will take precedence, and 'templateId' will be ignored."
    );
  }
  if (options.templateId) {
    // ID popzy
    this.template = document.querySelector(`#${options.templateId}`);
    // Check id
    if (!this.template) {
      console.error(`#${this.opt.templateId} does not exist!`);
      return;
    }
  }
  this.opt = Object.assign(
    {
      closeMethods: ["button", "overlay", "escape"],
      footer: false,
      cssClass: [],
      destroyOnclose: true,
      enableScrollLock: true,
      scrollLockTarget: () => document.body,
    },
    options
  );
  this.content = this.opt.content;

  // Variable scrollbar width
  let _scrollBarWidth;

  // Check close method
  this._allowButtonClose = this.opt.closeMethods.includes("button");
  this._allowBackdropClose = this.opt.closeMethods.includes("overlay");
  this._allowEscapeClose = this.opt.closeMethods.includes("escape");

  //   Variable footer button
  this._footerButton = [];

  //  Build this of _handleEscape
  this._handleEscape = this._handleEscape.bind(this);
}

Popzy.prototype._hasScrollbar = function (target) {
  if ([document.documentElement, document.body].includes(target))
    return (
      document.documentElement.scrollHeight >
        document.documentElement.clientHeight ||
      document.body.scrollHeight > document.body.clientHeight
    );
  return target.scrollHeight > target.clientHeight;
};

Popzy.prototype._getScrollBarWidth = function () {
  if (this._scrollBarWidth) return this._scrollBarWidth;

  const div = document.createElement("div");

  Object.assign(div.style, {
    overflow: "scroll",
    position: "absolute",
    top: "-999",
  });

  document.body.appendChild(div);
  this._scrollBarWidth = div.offsetWidth - div.clientWidth;
  document.body.removeChild(div);

  return this._scrollBarWidth;
};

Popzy.prototype._build = function () {
  const contentNode = this.content
    ? document.createElement("div")
    : this.template.content.cloneNode(true);
  if (this.content) {
    contentNode.innerHTML = this.content;
  }

  // Create backdrop
  this._backdrop = document.createElement("div");
  this._backdrop.className = "popzy__backdrop";

  // Create container
  const container = document.createElement("div");
  container.className = "popzy__container";

  // Add class in container
  this.opt.cssClass.forEach((className) => {
    if (typeof className === "string") {
      container.classList.add(className);
    }
  });

  if (this._allowButtonClose) {
    const closeBtn = this._createButton("&times;", "popzy__close", () =>
      this.close()
    );
    container.append(closeBtn);
  }

  // Create modalContent
  this._modalContent = document.createElement("div");
  this._modalContent.className = "popzy__content";
  this._modalContent.append(contentNode);
  container.append(this._modalContent);

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

  if (!this._backdrop) {
    this._build();
  }

  setTimeout(() => {
    this._backdrop.classList.add("popzy__show");
  }, 0);

  if (this.opt.enableScrollLock) {
    const target = this.opt.scrollLockTarget();

    if (this._hasScrollbar(target) && Popzy.elements.length === 1) {
      target.classList.add("popzy__no--scroll");
      const targetPaddingRight = parseFloat(
        getComputedStyle(target).paddingRight
      );
      target.style.paddingRight =
        targetPaddingRight + this._getScrollBarWidth() + "px";
    }
  }

  // Close when backdrop click
  if (this._allowBackdropClose) {
    this._backdrop.onclick = (e) => {
      if (e.target === this._backdrop) {
        this.close();
      }
    };
  }

  // Close escape(ESC) button
  if (this._allowEscapeClose) {
    document.addEventListener("keydown", this._handleEscape);
  }

  //
  this._onTransitionEnd(this.opt.onOpen);

  return this._backdrop;
};

Popzy.prototype.setContent = function (content) {
  this.content = content;
  if (this._modalContent) {
    this._modalContent.innerHTML = content;
  }
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

// Method lose modal escape
Popzy.prototype._handleEscape = function (e) {
  const lastPopzy = Popzy.elements[Popzy.elements.length - 1];

  if (e.key === "Escape" && this === lastPopzy) {
    this.close();
  }
};

// Event is fired when a CSS transition has completed
Popzy.prototype._onTransitionEnd = function (callback) {
  this._backdrop.ontransitionend = (e) => {
    if (e.propertyName !== "transform") return;
    if (typeof callback === "function") callback();
  };
};

// Method close
Popzy.prototype.close = function (destroy = this.opt.destroyOnclose) {
  Popzy.elements.pop();
  this._backdrop.classList.remove("popzy__show");

  this._onTransitionEnd(() => {
    if (this._backdrop && destroy) {
      this._backdrop.remove();
      this._backdrop = null;
      this._popzyFooter = null;
    }

    if (!Popzy.elements.length && this.opt.enableScrollLock) {
      const target = this.opt.scrollLockTarget();
      if (this._hasScrollbar) {
        target.classList.remove("popzy__no--scroll");
        target.style.paddingRight = "";
      }
    }

    // Remove keydown event to avoid errors
    document.removeEventListener("keydown", this._handleEscape);

    if (typeof this.opt.onClose === "function") {
      this.opt.onClose();
    }
  });
};

// Close popzy method
Popzy.prototype.destroy = function () {
  this.close(true);
};
